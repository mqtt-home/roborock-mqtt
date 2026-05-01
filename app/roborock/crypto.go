package roborock

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"hash/crc32"
)

const appSecretSalt = "TXdfu$jyZ#TZHsg4"

// shuffleTimestamp rearranges the hex-encoded timestamp using pattern [5,6,3,7,1,2,0,4].
func shuffleTimestamp(timestamp uint32) string {
	hexStr := fmt.Sprintf("%08x", timestamp)
	pattern := []int{5, 6, 3, 7, 1, 2, 0, 4}
	result := make([]byte, 8)
	for i, idx := range pattern {
		result[i] = hexStr[idx]
	}
	return string(result)
}

// deriveKey derives the AES key from timestamp + device key + salt.
func deriveKey(timestamp uint32, deviceKey string) []byte {
	shuffled := shuffleTimestamp(timestamp)
	input := shuffled + deviceKey + appSecretSalt
	hash := md5.Sum([]byte(input))
	return hash[:]
}

// pkcs5Pad pads data to a multiple of blockSize using PKCS5.
func pkcs5Pad(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padtext...)
}

// pkcs5Unpad removes PKCS5 padding.
func pkcs5Unpad(data []byte) ([]byte, error) {
	length := len(data)
	if length == 0 {
		return nil, fmt.Errorf("empty data")
	}
	padding := int(data[length-1])
	if padding > length || padding > aes.BlockSize || padding == 0 {
		return nil, fmt.Errorf("invalid padding")
	}
	for i := length - padding; i < length; i++ {
		if data[i] != byte(padding) {
			return nil, fmt.Errorf("invalid padding")
		}
	}
	return data[:length-padding], nil
}

// encryptECB encrypts data using AES-128 ECB mode with PKCS5 padding.
func encryptECB(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	padded := pkcs5Pad(data, aes.BlockSize)
	encrypted := make([]byte, len(padded))

	for i := 0; i < len(padded); i += aes.BlockSize {
		block.Encrypt(encrypted[i:i+aes.BlockSize], padded[i:i+aes.BlockSize])
	}

	return encrypted, nil
}

// decryptECB decrypts AES-128 ECB encrypted data and removes PKCS5 padding.
func decryptECB(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	if len(data)%aes.BlockSize != 0 {
		return nil, fmt.Errorf("data length %d is not a multiple of block size %d", len(data), aes.BlockSize)
	}

	decrypted := make([]byte, len(data))
	for i := 0; i < len(data); i += aes.BlockSize {
		block.Decrypt(decrypted[i:i+aes.BlockSize], data[i:i+aes.BlockSize])
	}

	return pkcs5Unpad(decrypted)
}

// computeCRC32 computes CRC32 checksum of the given data.
func computeCRC32(data []byte) uint32 {
	return crc32.ChecksumIEEE(data)
}

// md5Hash computes the MD5 hash of a string and returns the hex-encoded result.
func md5Hash(input string) string {
	hash := md5.Sum([]byte(input))
	return hex.EncodeToString(hash[:])
}

// deriveMQTTCredentials computes MQTT username and password from login credentials.
func deriveMQTTCredentials(userID, sessionID, mqttKey string) (username, password string) {
	userHash := md5Hash(userID + ":" + mqttKey)
	sessionHash := md5Hash(sessionID + ":" + mqttKey)
	username = userHash[2:10]
	password = sessionHash[16:]
	return
}

// encryptMessage encrypts a JSON payload for sending to the device.
func encryptMessage(payload []byte, timestamp uint32, deviceKey string) ([]byte, error) {
	key := deriveKey(timestamp, deviceKey)
	return encryptECB(payload, key)
}

// decryptMessage decrypts an encrypted payload from the device.
func decryptMessage(encrypted []byte, timestamp uint32, deviceKey string) ([]byte, error) {
	key := deriveKey(timestamp, deviceKey)
	return decryptECB(encrypted, key)
}

// validateCRC32 validates the CRC32 footer of a message.
func validateCRC32(headerAndBody []byte, expectedCRC uint32) bool {
	return computeCRC32(headerAndBody) == expectedCRC
}

// readCRC32 reads a 4-byte CRC32 value from raw bytes.
func readCRC32(data []byte) uint32 {
	return binary.BigEndian.Uint32(data)
}

// decryptCBC decrypts AES-128 CBC encrypted data using the given key and IV.
func decryptCBC(data []byte, key []byte, iv []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	if len(data)%aes.BlockSize != 0 {
		return nil, fmt.Errorf("CBC data length %d is not a multiple of block size", len(data))
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	decrypted := make([]byte, len(data))
	mode.CryptBlocks(decrypted, data)

	return pkcs5Unpad(decrypted)
}

// MapSecurityData holds the nonce and endpoint for map requests.
type MapSecurityData struct {
	Endpoint string `json:"endpoint"`
	Nonce    string `json:"nonce"`
	nonce    []byte // raw nonce bytes for decryption
}

const nonceGenerationSalt = "ThisIsASecret"
const mapEndpoint = "aAbBz0"

// GenerateMapSecurity creates security data for a GET_MAP_V1 request.
func GenerateMapSecurity() *MapSecurityData {
	nonce := make([]byte, 16)
	rand.Read(nonce)
	nonceHex := hex.EncodeToString(nonce)

	endpointHash := md5.Sum([]byte(mapEndpoint))
	endpointB64 := hex.EncodeToString(endpointHash[:])

	return &MapSecurityData{
		Endpoint: endpointB64,
		Nonce:    nonceHex,
		nonce:    nonce,
	}
}

// DecryptMapData decrypts map response data using CBC.
// Key = raw nonce bytes (16 bytes), IV = all zeros.
func (s *MapSecurityData) DecryptMapData(data []byte) ([]byte, error) {
	key := s.nonce
	iv := make([]byte, aes.BlockSize) // all zeros

	return decryptCBC(data, key, iv)
}
