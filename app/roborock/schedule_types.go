package roborock

// DayType represents the type of day for schedule resolution.
type DayType string

const (
	DayTypeNormal    DayType = "normal"
	DayTypeWeekend   DayType = "weekend"
	DayTypeFree      DayType = "free"
	DayTypeNotAtHome DayType = "notAtHome"
)

// ScheduleSource indicates where a schedule came from.
type ScheduleSource string

const (
	SourceProvisioned ScheduleSource = "provisioned"
	SourceUser        ScheduleSource = "user"
	SourceNone        ScheduleSource = "none"
)

// ScheduleState represents the current schedule state for a device, used in API responses and MQTT publishing.
type ScheduleState struct {
	Device     string         `json:"device"`
	Source     ScheduleSource `json:"source"`
	ActiveDay  DayType        `json:"active_day"`
	NotAtHome  bool           `json:"not_at_home"`
	Holiday    bool           `json:"holiday"`
	Vacation   bool           `json:"vacation"`
	NextAction *NextAction    `json:"next_action,omitempty"`
}

// NextAction represents the next scheduled action for a device.
type NextAction struct {
	Time    string `json:"time"`
	Action  string `json:"action"`
	SceneID int    `json:"scene_id,omitempty"`
}
