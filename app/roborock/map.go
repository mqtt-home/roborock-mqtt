package roborock

import (
	"encoding/binary"
	"fmt"

	"github.com/philipparndt/go-logger"
)

// Block types in the Roborock map format.
const (
	BlockCharger       = 1
	BlockImage         = 2
	BlockVacuumPath    = 3
	BlockGoToPath      = 4
	BlockPredictedPath = 5
	BlockCleanedZones  = 6
	BlockGoToTarget    = 7
	BlockRobotPosition = 8
	BlockNoGoZones     = 9
	BlockVirtualWalls  = 10
	BlockRoomSegments  = 11
	BlockNoMopZones    = 12
)

// MapData represents parsed Roborock map data.
type MapData struct {
	MajorVersion int
	MinorVersion int
	MapIndex     int
	MapSequence  int
	Image        *MapImage
	Charger      *MapPosition
	Robot        *MapPosition
	Path         []MapPoint
	Rooms        map[int]bool // room IDs present
}

// MapImage represents the pixel grid of the map.
type MapImage struct {
	Top    int
	Left   int
	Width  int
	Height int
	Pixels []byte // raw pixel data, 1 byte per pixel
}

// MapPosition represents a position on the map (robot, charger).
type MapPosition struct {
	X     int
	Y     int
	Angle int
}

// MapPoint represents a coordinate pair in a path.
type MapPoint struct {
	X int
	Y int
}

// ParseMapData parses the Roborock binary map format.
// The input should already be decompressed (post-gzip).
func ParseMapData(data []byte) (*MapData, error) {
	if len(data) < 20 {
		return nil, fmt.Errorf("map data too short: %d bytes", len(data))
	}

	// File header
	magic := string(data[0:2])
	if magic != "RR" && magic != "rr" {
		return nil, fmt.Errorf("invalid map magic: %q", magic)
	}

	headerLen := int(binary.LittleEndian.Uint16(data[2:4]))
	_ = binary.LittleEndian.Uint32(data[4:8]) // data length

	mapData := &MapData{
		MajorVersion: int(binary.LittleEndian.Uint16(data[8:10])),
		MinorVersion: int(binary.LittleEndian.Uint16(data[10:12])),
		MapIndex:     int(binary.LittleEndian.Uint32(data[12:16])),
		MapSequence:  int(binary.LittleEndian.Uint32(data[16:20])),
		Rooms:        make(map[int]bool),
	}

	// Parse blocks
	offset := headerLen
	for offset+8 <= len(data) {
		blockType := int(binary.LittleEndian.Uint16(data[offset : offset+2]))
		blockHeaderLen := int(binary.LittleEndian.Uint16(data[offset+2 : offset+4]))
		blockDataLen := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))

		if offset+blockHeaderLen+blockDataLen > len(data) {
			logger.Debug("Map block truncated", "type", blockType, "offset", offset)
			break
		}

		blockHeader := data[offset : offset+blockHeaderLen]
		blockData := data[offset+blockHeaderLen : offset+blockHeaderLen+blockDataLen]

		logger.Debug("Map block", "type", blockType, "headerLen", blockHeaderLen, "dataLen", blockDataLen, "offset", offset)
		parseBlock(mapData, blockType, blockHeader, blockData)

		offset += blockHeaderLen + blockDataLen
	}

	if mapData.Image != nil {
		logger.Debug("Map image parsed", "width", mapData.Image.Width, "height", mapData.Image.Height, "pixels", len(mapData.Image.Pixels), "top", mapData.Image.Top, "left", mapData.Image.Left)
	} else {
		logger.Debug("No image block found in map data")
	}

	return mapData, nil
}

func parseBlock(md *MapData, blockType int, header []byte, data []byte) {
	switch blockType {
	case BlockCharger:
		if len(header) >= 16 {
			md.Charger = &MapPosition{
				X: int(binary.LittleEndian.Uint32(header[8:12])),
				Y: int(binary.LittleEndian.Uint32(header[12:16])),
			}
		}
	case BlockImage:
		parseImageBlock(md, header, data)
	case BlockVacuumPath:
		parsPathBlock(md, header, data)
	case BlockRobotPosition:
		if len(header) >= 16 {
			md.Robot = &MapPosition{
				X: int(binary.LittleEndian.Uint32(header[8:12])),
				Y: int(binary.LittleEndian.Uint32(header[12:16])),
			}
			if len(header) >= 20 {
				md.Robot.Angle = int(binary.LittleEndian.Uint32(header[16:20]))
			}
		}
	case BlockRoomSegments:
		// Room segment IDs in the data bytes
		for _, b := range data {
			if b > 0 {
				md.Rooms[int(b)] = true
			}
		}
	case 1024:
		// Digest block — ignore
	default:
		logger.Debug("Unknown map block type", "type", blockType)
	}
}

func parseImageBlock(md *MapData, header []byte, data []byte) {
	if len(header) < 24 {
		return
	}

	var top, left, height, width int

	if len(header) >= 28 {
		// 28-byte header: [8:12]=flags, [12:16]=top, [16:20]=left, [20:24]=height, [24:28]=width
		top = int(binary.LittleEndian.Uint32(header[12:16]))
		left = int(binary.LittleEndian.Uint32(header[16:20]))
		height = int(binary.LittleEndian.Uint32(header[20:24]))
		width = int(binary.LittleEndian.Uint32(header[24:28]))
	} else {
		top = int(binary.LittleEndian.Uint32(header[8:12]))
		left = int(binary.LittleEndian.Uint32(header[12:16]))
		height = int(binary.LittleEndian.Uint32(header[16:20]))
		width = int(binary.LittleEndian.Uint32(header[20:24]))
	}

	md.Image = &MapImage{
		Top:    top,
		Left:   left,
		Height: height,
		Width:  width,
		Pixels: data,
	}
}

func parsPathBlock(md *MapData, header []byte, data []byte) {
	if len(header) < 20 {
		return
	}

	pointCount := int(binary.LittleEndian.Uint32(header[8:12]))
	_ = binary.LittleEndian.Uint32(header[12:16]) // point size
	_ = binary.LittleEndian.Uint32(header[16:20]) // angle

	md.Path = make([]MapPoint, 0, pointCount)
	for i := 0; i+3 < len(data); i += 4 {
		x := int(binary.LittleEndian.Uint16(data[i : i+2]))
		y := int(binary.LittleEndian.Uint16(data[i+2 : i+4]))
		md.Path = append(md.Path, MapPoint{X: x, Y: y})
	}
}

// PixelType classifies a pixel value from the map image.
type PixelType int

const (
	PixelEmpty   PixelType = 0
	PixelWall    PixelType = 1
	PixelFloor   PixelType = 2
	PixelRoom    PixelType = 3
)

// ClassifyPixel determines the type and room ID of a pixel value.
// Encoding: 0=outside, 1=floor/inside, 255=wall, 2-254=room segments.
func ClassifyPixel(value byte) (PixelType, int) {
	switch {
	case value == 0:
		return PixelEmpty, 0
	case value == 255:
		return PixelWall, 0
	case value == 1:
		return PixelFloor, 0
	default:
		return PixelRoom, int(value)
	}
}
