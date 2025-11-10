package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

type WebSocketHandler struct{}

func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Println("WebSocket client connected")

	// Send initial connection message
	conn.WriteJSON(gin.H{
		"type":    "connected",
		"message": "WebSocket connected",
		"time":    time.Now().Unix(),
	})

	// Keep connection alive with ping/pong
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Handle incoming messages
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("WebSocket read error: %v", err)
				break
			}

			var msg map[string]interface{}
			if err := json.Unmarshal(message, &msg); err == nil {
				log.Printf("Received message: %v", msg)
			}
		}
	}()

	// Send periodic updates
	for {
		select {
		case <-ticker.C:
			// Send ping to keep connection alive
			if err := conn.WriteJSON(gin.H{
				"type": "ping",
				"time": time.Now().Unix(),
			}); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

