package web

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/mqtt-home/roborock-mqtt/roborock"
	"github.com/philipparndt/go-logger"
	loggerchi "github.com/philipparndt/go-logger/chi"
)

type SSEClient struct {
	ID      string
	Channel chan string
}

type WebServer struct {
	deviceManager *roborock.DeviceManager
	restClient    *roborock.Client
	onAuth        func()
	router        *chi.Mux
	sseClients    map[string]*SSEClient
	sseClientsMu  sync.RWMutex
}

func NewWebServer(
	deviceManager *roborock.DeviceManager,
	restClient *roborock.Client,
	onAuth func(),
) *WebServer {
	ws := &WebServer{
		deviceManager: deviceManager,
		restClient:    restClient,
		onAuth:        onAuth,
		router:        chi.NewRouter(),
		sseClients:    make(map[string]*SSEClient),
	}

	ws.setupRoutes()
	return ws
}

// SetDeviceManager updates the device manager after authentication.
func (ws *WebServer) SetDeviceManager(dm *roborock.DeviceManager) {
	ws.deviceManager = dm
}

func (ws *WebServer) setupRoutes() {
	ws.router.Use(loggerchi.LoggerWithLevel(slog.LevelDebug))
	ws.router.Use(middleware.Recoverer)

	ws.router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	ws.router.Route("/api", func(r chi.Router) {
		r.Get("/health", ws.healthCheck)

		// Auth endpoints
		r.Get("/auth/status", ws.authStatus)
		r.Post("/auth/request-code", ws.requestCode)
		r.Post("/auth/login", ws.authLogin)
		r.Post("/auth/logout", ws.authLogout)

		// Device endpoints
		r.Get("/devices", ws.getDevices)
		r.Get("/status", ws.getAllStatus)
		r.Route("/devices/{slug}", func(r chi.Router) {
			r.Get("/status", ws.getDeviceStatus)
			r.Post("/start", ws.deviceCommand("start"))
			r.Post("/pause", ws.deviceCommand("pause"))
			r.Post("/dock", ws.deviceCommand("dock"))
			r.Post("/fan-speed", ws.deviceFanSpeed)
			r.Post("/mop-mode", ws.deviceMopMode)
			r.Get("/map", ws.deviceMap)
			r.Get("/scenes", ws.deviceScenes)
			r.Post("/scenes/{id}/execute", ws.executeScene)
		})

		r.Get("/events", ws.handleSSE)
	})

	fileServer := http.FileServer(http.Dir("./web/dist/"))
	ws.router.Handle("/*", fileServer)
}

// --- Auth endpoints ---

func (ws *WebServer) authStatus(w http.ResponseWriter, _ *http.Request) {
	authenticated := ws.restClient.IsAuthenticated()
	resp := map[string]any{
		"authenticated": authenticated,
	}
	if authenticated {
		resp["user"] = ws.restClient.GetLoginData().Nickname
		resp["devices"] = len(ws.restClient.GetDevices())
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (ws *WebServer) requestCode(w http.ResponseWriter, _ *http.Request) {
	if err := ws.restClient.RequestCode(); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	ws.jsonOK(w)
}

type CodeLoginRequest struct {
	Code string `json:"code"`
}

func (ws *WebServer) authLogin(w http.ResponseWriter, r *http.Request) {
	var req CodeLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" {
		http.Error(w, `{"error":"code is required"}`, http.StatusBadRequest)
		return
	}

	if err := ws.restClient.CodeLogin(req.Code); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Save login data immediately
	if err := ws.restClient.SaveSession(); err != nil {
		logger.Warn("Failed to save session after login", "error", err)
	}

	if err := ws.restClient.DiscoverDevice(); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Login succeeded but failed to discover devices: " + err.Error()})
		return
	}

	// Save again with devices
	if err := ws.restClient.SaveSession(); err != nil {
		logger.Warn("Failed to save session after discovery", "error", err)
	}

	// Start the bridge (synchronous so devices are ready for the response)
	if ws.onAuth != nil {
		ws.onAuth()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":  "success",
		"user":    ws.restClient.GetLoginData().Nickname,
		"devices": len(ws.restClient.GetDevices()),
	})
}

func (ws *WebServer) authLogout(w http.ResponseWriter, _ *http.Request) {
	ws.restClient.ClearSession()
	ws.jsonOK(w)
}

// --- Device endpoints ---

func (ws *WebServer) getDevices(w http.ResponseWriter, _ *http.Request) {
	if ws.deviceManager == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]any{})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ws.deviceManager.GetSummaries())
}

func (ws *WebServer) getAllStatus(w http.ResponseWriter, _ *http.Request) {
	if ws.deviceManager == nil {
		http.Error(w, "Not connected", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ws.deviceManager.GetSummaries())
}

func (ws *WebServer) getDeviceStatus(w http.ResponseWriter, r *http.Request) {
	dev := ws.getDeviceFromRequest(w, r)
	if dev == nil {
		return
	}
	status := dev.GetStatus()
	if status == nil {
		http.Error(w, "No status available", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (ws *WebServer) deviceCommand(action string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dev := ws.getDeviceFromRequest(w, r)
		if dev == nil || dev.CloudMQTT == nil {
			return
		}

		var err error
		switch action {
		case "start":
			err = dev.CloudMQTT.Start()
		case "pause":
			err = dev.CloudMQTT.Pause()
		case "dock":
			err = dev.CloudMQTT.Dock()
		}

		if err != nil {
			logger.Error("Command failed", "device", dev.Slug, "action", action, "error", err)
		}
		ws.jsonOK(w)
	}
}

type FanSpeedRequest struct {
	Speed string `json:"speed"`
}

func (ws *WebServer) deviceFanSpeed(w http.ResponseWriter, r *http.Request) {
	dev := ws.getDeviceFromRequest(w, r)
	if dev == nil || dev.CloudMQTT == nil {
		return
	}
	var req FanSpeedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	go func() {
		if err := dev.CloudMQTT.SetFanSpeed(req.Speed); err != nil {
			logger.Error("Failed to set fan speed", "device", dev.Slug, "error", err)
		}
	}()
	ws.jsonOK(w)
}

type MopModeRequest struct {
	Mode string `json:"mode"`
}

func (ws *WebServer) deviceMopMode(w http.ResponseWriter, r *http.Request) {
	dev := ws.getDeviceFromRequest(w, r)
	if dev == nil || dev.CloudMQTT == nil {
		return
	}
	var req MopModeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	go func() {
		if err := dev.CloudMQTT.SetMopMode(req.Mode); err != nil {
			logger.Error("Failed to set mop mode", "device", dev.Slug, "error", err)
		}
	}()
	ws.jsonOK(w)
}

func (ws *WebServer) deviceScenes(w http.ResponseWriter, r *http.Request) {
	dev := ws.getDeviceFromRequest(w, r)
	if dev == nil {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if dev.Scenes == nil {
		json.NewEncoder(w).Encode([]any{})
	} else {
		json.NewEncoder(w).Encode(dev.Scenes)
	}
}

func (ws *WebServer) executeScene(w http.ResponseWriter, r *http.Request) {
	if ws.deviceManager == nil {
		http.Error(w, `{"error":"not connected"}`, http.StatusServiceUnavailable)
		return
	}
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid scene id"}`, http.StatusBadRequest)
		return
	}
	if err := ws.deviceManager.ExecuteScene(id); err != nil {
		logger.Error("Failed to execute scene", "id", id, "error", err)
		http.Error(w, `{"error":"failed to execute scene"}`, http.StatusInternalServerError)
		return
	}
	ws.jsonOK(w)
}

func (ws *WebServer) deviceMap(w http.ResponseWriter, r *http.Request) {
	dev := ws.getDeviceFromRequest(w, r)
	if dev == nil {
		return
	}
	mapPNG := dev.GetMapPNG()
	if mapPNG == nil {
		http.Error(w, "No map available", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(mapPNG)
}

func (ws *WebServer) getDeviceFromRequest(w http.ResponseWriter, r *http.Request) *roborock.ManagedDevice {
	if ws.deviceManager == nil {
		http.Error(w, `{"error":"not connected"}`, http.StatusServiceUnavailable)
		return nil
	}
	slug := chi.URLParam(r, "slug")
	dev := ws.deviceManager.GetDevice(slug)
	if dev == nil {
		http.Error(w, `{"error":"device not found"}`, http.StatusNotFound)
		return nil
	}
	return dev
}

func (ws *WebServer) healthCheck(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":        "ok",
		"goroutines":    runtime.NumGoroutine(),
		"authenticated": ws.restClient.IsAuthenticated(),
		"timestamp":     time.Now().UTC().Format(time.RFC3339),
	})
}

func (ws *WebServer) jsonOK(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// --- SSE ---

// BroadcastDeviceStatus sends a per-device status update to all SSE clients.
func (ws *WebServer) BroadcastDeviceStatus(slug string, status *roborock.PublishedStatus) {
	payload := struct {
		Device string `json:"device"`
		*roborock.PublishedStatus
	}{
		Device:          slug,
		PublishedStatus: status,
	}

	message, err := json.Marshal(payload)
	if err != nil {
		return
	}
	messageStr := string(message)

	ws.sseClientsMu.RLock()
	for _, client := range ws.sseClients {
		select {
		case client.Channel <- messageStr:
		default:
		}
	}
	ws.sseClientsMu.RUnlock()
}

func (ws *WebServer) handleSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	clientID := fmt.Sprintf("%d", time.Now().UnixNano())
	channel := make(chan string, 10)

	ws.sseClientsMu.Lock()
	ws.sseClients[clientID] = &SSEClient{ID: clientID, Channel: channel}
	ws.sseClientsMu.Unlock()

	// Send initial state for all devices
	if ws.deviceManager != nil {
		for _, summary := range ws.deviceManager.GetSummaries() {
			if summary.Status != nil {
				payload := struct {
					Device string `json:"device"`
					*roborock.PublishedStatus
				}{Device: summary.Slug, PublishedStatus: summary.Status}
				msg, _ := json.Marshal(payload)
				fmt.Fprintf(w, "data: %s\n\n", string(msg))
			}
		}
	}

	flusher, ok := w.(http.Flusher)
	if ok {
		flusher.Flush()
	}

	defer func() {
		ws.sseClientsMu.Lock()
		delete(ws.sseClients, clientID)
		close(channel)
		ws.sseClientsMu.Unlock()
	}()

	for {
		select {
		case msg := <-channel:
			if _, err := fmt.Fprintf(w, "data: %s\n\n", msg); err != nil {
				return
			}
			if ok {
				flusher.Flush()
			}
		case <-r.Context().Done():
			return
		}
	}
}

func (ws *WebServer) Start(port int) error {
	addr := ":" + strconv.Itoa(port)
	logger.Info("Starting web server", "address", addr)
	return http.ListenAndServe(addr, ws.router)
}
