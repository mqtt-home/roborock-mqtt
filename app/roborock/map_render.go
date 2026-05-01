package roborock

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
)

// Room color palette — 16 distinct colors cycling by room ID.
var roomColors = []color.RGBA{
	{66, 133, 244, 255},   // blue
	{52, 168, 83, 255},    // green
	{251, 188, 4, 255},    // yellow
	{234, 67, 53, 255},    // red
	{103, 58, 183, 255},   // purple
	{0, 188, 212, 255},    // cyan
	{255, 152, 0, 255},    // orange
	{233, 30, 99, 255},    // pink
	{0, 150, 136, 255},    // teal
	{121, 85, 72, 255},    // brown
	{63, 81, 181, 255},    // indigo
	{139, 195, 74, 255},   // light green
	{255, 87, 34, 255},    // deep orange
	{158, 158, 158, 255},  // grey
	{33, 150, 243, 255},   // light blue
	{205, 220, 57, 255},   // lime
}

var (
	colorEmpty   = color.RGBA{0, 0, 0, 0}          // transparent
	colorWall    = color.RGBA{60, 60, 60, 255}      // dark gray
	colorFloor   = color.RGBA{180, 190, 200, 255}   // light gray-blue
	colorRobot   = color.RGBA{52, 168, 83, 255}     // green
	colorCharger = color.RGBA{66, 133, 244, 255}    // blue
	colorPath    = color.RGBA{255, 255, 255, 80}    // white semi-transparent
)

// RenderMapPNG renders parsed map data to a PNG image.
func RenderMapPNG(md *MapData) ([]byte, error) {
	if md.Image == nil || md.Image.Width == 0 || md.Image.Height == 0 {
		return nil, nil
	}

	img := image.NewRGBA(image.Rect(0, 0, md.Image.Width, md.Image.Height))

	// Draw pixels
	for y := 0; y < md.Image.Height; y++ {
		for x := 0; x < md.Image.Width; x++ {
			idx := y*md.Image.Width + x
			if idx >= len(md.Image.Pixels) {
				continue
			}

			pixelType, roomID := ClassifyPixel(md.Image.Pixels[idx])
			var c color.RGBA
			switch pixelType {
			case PixelEmpty:
				c = colorEmpty
			case PixelWall:
				c = colorWall
			case PixelFloor:
				c = colorFloor
			case PixelRoom:
				c = roomColors[roomID%len(roomColors)]
			}
			img.SetRGBA(x, y, c)
		}
	}

	// Draw cleaning path
	for _, p := range md.Path {
		px, py := mapToPixel(p.X, p.Y, md.Image)
		if px >= 0 && px < md.Image.Width && py >= 0 && py < md.Image.Height {
			img.SetRGBA(px, py, colorPath)
		}
	}

	// Draw charger position (5x5 square)
	if md.Charger != nil {
		cx, cy := mapToPixel(md.Charger.X, md.Charger.Y, md.Image)
		drawMarker(img, cx, cy, colorCharger, 3)
	}

	// Draw robot position (5x5 square)
	if md.Robot != nil {
		rx, ry := mapToPixel(md.Robot.X, md.Robot.Y, md.Image)
		drawMarker(img, rx, ry, colorRobot, 3)
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// mapToPixel converts map coordinates (mm) to pixel coordinates.
func mapToPixel(x, y int, img *MapImage) (int, int) {
	px := (x / 50) - img.Left
	py := (y / 50) - img.Top
	return px, py
}

// drawMarker draws a square marker at the given position.
func drawMarker(img *image.RGBA, cx, cy int, c color.RGBA, radius int) {
	bounds := img.Bounds()
	for dy := -radius; dy <= radius; dy++ {
		for dx := -radius; dx <= radius; dx++ {
			px, py := cx+dx, cy+dy
			if px >= bounds.Min.X && px < bounds.Max.X && py >= bounds.Min.Y && py < bounds.Max.Y {
				img.SetRGBA(px, py, c)
			}
		}
	}
}
