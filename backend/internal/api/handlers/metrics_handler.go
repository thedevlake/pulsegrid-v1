package handlers

import (
	"net/http"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/metrics"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type MetricsHandler struct {
	exporter *metrics.PrometheusExporter
	cfg      *config.Config
}

func NewMetricsHandler(healthCheckRepo *repository.HealthCheckRepository, cfg *config.Config) *MetricsHandler {
	return &MetricsHandler{
		exporter: metrics.NewPrometheusExporter(healthCheckRepo.GetDB()),
		cfg:      cfg,
	}
}

// GetPrometheusMetrics returns metrics in Prometheus format
func (h *MetricsHandler) GetPrometheusMetrics(c *gin.Context) {
	metricsOutput, err := h.exporter.ExportMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export metrics"})
		return
	}

	c.Header("Content-Type", "text/plain; version=0.0.4")
	c.String(http.StatusOK, metricsOutput)
}

