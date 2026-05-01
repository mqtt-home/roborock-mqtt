package roborock

import (
	"encoding/binary"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

const (
	headerSize  = 19
	footerSize  = 4
	protocolIPC = 101
)

var (
	sequenceCounter atomic.Uint32
)

// MessageHeader represents the 19-byte binary protocol header.
type MessageHeader struct {
	ProtocolVersion [3]byte // "1.0"
	SequenceNumber  uint32
	Random          uint32
	Timestamp       uint32
	Protocol        uint16
	PayloadLength   uint16
}

// PendingRequest tracks an outbound request awaiting a response.
type PendingRequest struct {
	RequestID int
	Method    string
	Response  chan []byte
	CreatedAt time.Time
}

// RequestTracker manages request-response correlation by IPC request ID.
type RequestTracker struct {
	mu      sync.Mutex
	pending map[int]*PendingRequest
}

func NewRequestTracker() *RequestTracker {
	return &RequestTracker{
		pending: make(map[int]*PendingRequest),
	}
}

func (rt *RequestTracker) Add(requestID int, method string) *PendingRequest {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	req := &PendingRequest{
		RequestID: requestID,
		Method:    method,
		Response:  make(chan []byte, 1),
		CreatedAt: time.Now(),
	}
	rt.pending[requestID] = req
	return req
}

func (rt *RequestTracker) Complete(requestID int, data []byte) bool {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	req, ok := rt.pending[requestID]
	if !ok {
		return false
	}

	select {
	case req.Response <- data:
	default:
	}
	delete(rt.pending, requestID)
	return true
}

func (rt *RequestTracker) Cleanup(maxAge time.Duration) {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	now := time.Now()
	for id, req := range rt.pending {
		if now.Sub(req.CreatedAt) > maxAge {
			close(req.Response)
			delete(rt.pending, id)
		}
	}
}

func nextSequenceNumber() uint32 {
	return sequenceCounter.Add(1)
}

// EncodeMessage builds a complete binary message: header + encrypted body + CRC32 footer.
func EncodeMessage(payload []byte, deviceKey string, protocol uint16) ([]byte, uint32, error) {
	timestamp := uint32(time.Now().Unix())
	seqNum := nextSequenceNumber()

	encrypted, err := encryptMessage(payload, timestamp, deviceKey)
	if err != nil {
		return nil, 0, fmt.Errorf("encrypt payload: %w", err)
	}

	header := make([]byte, headerSize)
	copy(header[0:3], []byte("1.0"))
	binary.BigEndian.PutUint32(header[3:7], seqNum)
	binary.BigEndian.PutUint32(header[7:11], uint32(rand.Int31n(2000)))
	binary.BigEndian.PutUint32(header[11:15], timestamp)
	binary.BigEndian.PutUint16(header[15:17], protocol)
	binary.BigEndian.PutUint16(header[17:19], uint16(len(encrypted)))

	message := make([]byte, 0, headerSize+len(encrypted)+footerSize)
	message = append(message, header...)
	message = append(message, encrypted...)

	checksum := computeCRC32(message)
	footer := make([]byte, footerSize)
	binary.BigEndian.PutUint32(footer, checksum)
	message = append(message, footer...)

	return message, seqNum, nil
}

// DecodeMessage parses a binary message, validates CRC32, and decrypts the payload.
func DecodeMessage(data []byte, deviceKey string) (*MessageHeader, []byte, error) {
	if len(data) < headerSize+footerSize {
		return nil, nil, fmt.Errorf("message too short: %d bytes", len(data))
	}

	header := &MessageHeader{}
	copy(header.ProtocolVersion[:], data[0:3])
	header.SequenceNumber = binary.BigEndian.Uint32(data[3:7])
	header.Random = binary.BigEndian.Uint32(data[7:11])
	header.Timestamp = binary.BigEndian.Uint32(data[11:15])
	header.Protocol = binary.BigEndian.Uint16(data[15:17])
	header.PayloadLength = binary.BigEndian.Uint16(data[17:19])

	expectedLen := headerSize + int(header.PayloadLength) + footerSize
	if len(data) < expectedLen {
		return nil, nil, fmt.Errorf("message truncated: got %d, expected %d", len(data), expectedLen)
	}

	headerAndBody := data[:headerSize+int(header.PayloadLength)]
	footerBytes := data[headerSize+int(header.PayloadLength) : headerSize+int(header.PayloadLength)+footerSize]
	expectedCRC := readCRC32(footerBytes)

	if !validateCRC32(headerAndBody, expectedCRC) {
		return nil, nil, fmt.Errorf("CRC32 mismatch")
	}

	encrypted := data[headerSize : headerSize+int(header.PayloadLength)]
	if len(encrypted) == 0 {
		return header, nil, nil
	}

	decrypted, err := decryptMessage(encrypted, header.Timestamp, deviceKey)
	if err != nil {
		return nil, nil, fmt.Errorf("decrypt payload: %w", err)
	}

	return header, decrypted, nil
}
