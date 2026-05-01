package roborock

import "encoding/json"

// VectorMap is the JSON-serializable vector representation of a map.
type VectorMap struct {
	Width   int              `json:"width"`
	Height  int              `json:"height"`
	Rooms   []VectorRoom     `json:"rooms"`
	Walls   []VectorSpan     `json:"walls"`
	Floor   []VectorSpan     `json:"floor"`
	Path    [][2]int         `json:"path"`
	Charger *VectorPosition  `json:"charger,omitempty"`
	Robot   *VectorPosition  `json:"robot,omitempty"`
}

// VectorRoom groups run-length encoded spans for a single room.
type VectorRoom struct {
	ID    int          `json:"id"`
	Color string       `json:"color"`
	Spans []VectorSpan `json:"spans"`
}

// VectorSpan is a horizontal run of pixels: row Y, from X to X+W.
type VectorSpan struct {
	X int `json:"x"`
	Y int `json:"y"`
	W int `json:"w"`
}

// VectorPosition represents a point with optional angle.
type VectorPosition struct {
	X     int `json:"x"`
	Y     int `json:"y"`
	Angle int `json:"angle,omitempty"`
}

// hexColors maps room color palette to hex strings.
var hexColors = []string{
	"#4285F4", "#34A853", "#FBBC04", "#EA4335",
	"#673AB7", "#00BCD4", "#FF9800", "#E91E63",
	"#009688", "#795548", "#3F51B5", "#8BC34A",
	"#FF5722", "#9E9E9E", "#2196F3", "#CDDC39",
}

// MapToVectorJSON converts parsed map data to a JSON vector representation.
func MapToVectorJSON(md *MapData) ([]byte, error) {
	if md.Image == nil || md.Image.Width == 0 || md.Image.Height == 0 {
		return nil, nil
	}

	w, h := md.Image.Width, md.Image.Height
	vm := VectorMap{
		Width:  w,
		Height: h,
	}

	// Collect spans per room ID
	roomSpans := make(map[int][]VectorSpan)

	for y := 0; y < h; y++ {
		// Flip Y for display (bottom-up to top-down)
		srcY := h - 1 - y
		x := 0
		for x < w {
			idx := srcY*w + x
			if idx >= len(md.Image.Pixels) {
				x++
				continue
			}

			pType, roomID := ClassifyPixel(md.Image.Pixels[idx])
			if pType == PixelEmpty {
				x++
				continue
			}

			// Run-length: find how far this same type+room extends
			startX := x
			for x < w {
				idx2 := srcY*w + x
				if idx2 >= len(md.Image.Pixels) {
					break
				}
				pType2, roomID2 := ClassifyPixel(md.Image.Pixels[idx2])
				if pType2 != pType || roomID2 != roomID {
					break
				}
				x++
			}

			span := VectorSpan{X: startX, Y: y, W: x - startX}

			switch pType {
			case PixelWall:
				vm.Walls = append(vm.Walls, span)
			case PixelFloor:
				vm.Floor = append(vm.Floor, span)
			case PixelRoom:
				roomSpans[roomID] = append(roomSpans[roomID], span)
			}
		}
	}

	// Convert room spans map to sorted list
	for id, spans := range roomSpans {
		vm.Rooms = append(vm.Rooms, VectorRoom{
			ID:    id,
			Color: hexColors[id%len(hexColors)],
			Spans: spans,
		})
	}

	// Path coordinates (flipped Y)
	for _, p := range md.Path {
		px := (p.X / 50) - md.Image.Left
		py := h - 1 - ((p.Y / 50) - md.Image.Top)
		vm.Path = append(vm.Path, [2]int{px, py})
	}

	// Positions (flipped Y)
	if md.Charger != nil {
		cx := (md.Charger.X / 50) - md.Image.Left
		cy := h - 1 - ((md.Charger.Y / 50) - md.Image.Top)
		vm.Charger = &VectorPosition{X: cx, Y: cy}
	}
	if md.Robot != nil {
		rx := (md.Robot.X / 50) - md.Image.Left
		ry := h - 1 - ((md.Robot.Y / 50) - md.Image.Top)
		vm.Robot = &VectorPosition{X: rx, Y: ry, Angle: md.Robot.Angle}
	}

	return json.Marshal(vm)
}
