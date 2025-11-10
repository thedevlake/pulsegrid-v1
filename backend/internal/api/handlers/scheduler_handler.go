package handlers

import (
	"net/http"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/scheduler"

	"github.com/gin-gonic/gin"
)

type SchedulerHandler struct {
	scheduler *scheduler.Scheduler
	cfg       *config.Config
}

func NewSchedulerHandler(sched *scheduler.Scheduler, cfg *config.Config) *SchedulerHandler {
	return &SchedulerHandler{
		scheduler: sched,
		cfg:       cfg,
	}
}

func (h *SchedulerHandler) SyncServices(c *gin.Context) {
	if err := h.scheduler.SyncAllServices(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync services: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Services synced successfully"})
}

