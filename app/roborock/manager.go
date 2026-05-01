package roborock

import (
	"fmt"
	"sync"
	"time"

	"github.com/philipparndt/go-logger"
)

// ManagedDevice represents a single device with its cloud MQTT connection and status.
type ManagedDevice struct {
	Info     DeviceInfo
	Slug     string
	CloudMQTT *CloudMQTT
	Status   *PublishedStatus
	mu       sync.RWMutex
}

func (md *ManagedDevice) GetStatus() *PublishedStatus {
	md.mu.RLock()
	defer md.mu.RUnlock()
	return md.Status
}

func (md *ManagedDevice) SetStatus(s *PublishedStatus) {
	md.mu.Lock()
	defer md.mu.Unlock()
	md.Status = s
}

// DeviceManager manages multiple Roborock devices.
type DeviceManager struct {
	devices   []*ManagedDevice
	bySlug    map[string]*ManagedDevice
	loginData *LoginData
	mu        sync.RWMutex
	onStatus  func(slug string, status *PublishedStatus)
}

// NewDeviceManager creates a manager for the given devices.
func NewDeviceManager(loginData *LoginData, devices []DeviceInfo) *DeviceManager {
	dm := &DeviceManager{
		loginData: loginData,
		bySlug:    make(map[string]*ManagedDevice),
	}

	usedSlugs := make(map[string]int)
	for _, dev := range devices {
		slug := Slugify(dev.Name)
		usedSlugs[slug]++
		if usedSlugs[slug] > 1 {
			slug = fmt.Sprintf("%s-%d", slug, usedSlugs[slug])
		}

		md := &ManagedDevice{
			Info: dev,
			Slug: slug,
		}
		dm.devices = append(dm.devices, md)
		dm.bySlug[slug] = md
	}

	return dm
}

// SetStatusCallback sets the function called when any device's status changes.
func (dm *DeviceManager) SetStatusCallback(cb func(slug string, status *PublishedStatus)) {
	dm.onStatus = cb
}

// ConnectAll establishes cloud MQTT connections for all devices.
func (dm *DeviceManager) ConnectAll() {
	for _, md := range dm.devices {
		dev := md // capture
		cloudMQTT := NewCloudMQTT(dm.loginData, &dev.Info)
		cloudMQTT.SetStatusCallback(func(status *DeviceStatus) {
			published := &PublishedStatus{
				State:      status.StateName,
				Battery:    status.Battery,
				FanSpeed:   status.FanSpeedName,
				MopMode:    status.MopModeName,
				WaterBox:   status.WaterBoxName,
				CleanTime:  status.CleanTime,
				CleanArea:  status.CleanArea,
				ErrorCode:  status.ErrorCode,
				Error:      status.ErrorName,
				InCleaning: status.InCleaning > 0,
			}
			dev.SetStatus(published)
			if dm.onStatus != nil {
				dm.onStatus(dev.Slug, published)
			}
		})

		if err := cloudMQTT.Connect(); err != nil {
			logger.Error("Failed to connect device", "device", dev.Info.Name, "slug", dev.Slug, "error", err)
			continue
		}

		dev.CloudMQTT = cloudMQTT
		logger.Info("Connected device", "device", dev.Info.Name, "slug", dev.Slug)
	}
}

// DisconnectAll disconnects all devices.
func (dm *DeviceManager) DisconnectAll() {
	for _, md := range dm.devices {
		if md.CloudMQTT != nil {
			md.CloudMQTT.Disconnect()
		}
	}
}

// PollAll polls status and consumables for all connected devices.
func (dm *DeviceManager) PollAll() {
	for _, md := range dm.devices {
		if md.CloudMQTT == nil || !md.CloudMQTT.IsConnected() {
			continue
		}

		status, err := md.CloudMQTT.PollStatus()
		if err != nil {
			logger.Error("Failed to poll status", "device", md.Slug, "error", err)
			continue
		}

		published := &PublishedStatus{
			State:      status.StateName,
			Battery:    status.Battery,
			FanSpeed:   status.FanSpeedName,
			MopMode:    status.MopModeName,
			WaterBox:   status.WaterBoxName,
			CleanTime:  status.CleanTime,
			CleanArea:  status.CleanArea,
			ErrorCode:  status.ErrorCode,
			Error:      status.ErrorName,
			InCleaning: status.InCleaning > 0,
		}

		consumables, err := md.CloudMQTT.PollConsumables()
		if err != nil {
			logger.Debug("Failed to poll consumables", "device", md.Slug, "error", err)
		} else {
			published.Consumables = *consumables
		}

		md.SetStatus(published)
		if dm.onStatus != nil {
			dm.onStatus(md.Slug, published)
		}
	}
}

// StartPolling starts periodic polling for all devices.
func (dm *DeviceManager) StartPolling(interval time.Duration, stop chan struct{}) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			dm.PollAll()
		case <-stop:
			return
		}
	}
}

// GetDevice returns a managed device by slug.
func (dm *DeviceManager) GetDevice(slug string) *ManagedDevice {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	return dm.bySlug[slug]
}

// GetDevices returns all managed devices.
func (dm *DeviceManager) GetDevices() []*ManagedDevice {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	return dm.devices
}

// DeviceSummary is used in API responses.
type DeviceSummary struct {
	Slug   string           `json:"slug"`
	Name   string           `json:"name"`
	Model  string           `json:"model"`
	Online bool             `json:"online"`
	Status *PublishedStatus `json:"status,omitempty"`
}

// GetSummaries returns a list of device summaries for the API.
func (dm *DeviceManager) GetSummaries() []DeviceSummary {
	var summaries []DeviceSummary
	for _, md := range dm.devices {
		summaries = append(summaries, DeviceSummary{
			Slug:   md.Slug,
			Name:   md.Info.Name,
			Model:  md.Info.Model,
			Online: md.CloudMQTT != nil && md.CloudMQTT.IsConnected(),
			Status: md.GetStatus(),
		})
	}
	return summaries
}
