package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	serviceRepo     *repository.ServiceRepository
	healthCheckRepo *repository.HealthCheckRepository
	cfg             *config.Config
}

func NewReportHandler(serviceRepo *repository.ServiceRepository, healthCheckRepo *repository.HealthCheckRepository, cfg *config.Config) *ReportHandler {
	return &ReportHandler{
		serviceRepo:     serviceRepo,
		healthCheckRepo: healthCheckRepo,
		cfg:             cfg,
	}
}

func (h *ReportHandler) ExportCSV(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	// Default to last 30 days
	since := time.Now().AddDate(0, 0, -30)
	if sinceStr := c.Query("since"); sinceStr != "" {
		if t, err := time.Parse(time.RFC3339, sinceStr); err == nil {
			since = t
		}
	}

	stats, err := h.healthCheckRepo.GetStatsByServiceID(serviceID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	service, err := h.serviceRepo.GetByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Set headers for CSV download
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=report-%s-%s.csv", service.Name, time.Now().Format("20060102")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"Service Name",
		"URL",
		"Period",
		"Uptime %",
		"Average Response Time (ms)",
		"Total Checks",
		"Up Checks",
		"Down Checks",
		"Status",
	})

	// Write data
	writer.Write([]string{
		service.Name,
		service.URL,
		fmt.Sprintf("%s to %s", since.Format("2006-01-02"), time.Now().Format("2006-01-02")),
		fmt.Sprintf("%.2f", stats.UptimePercent),
		fmt.Sprintf("%.2f", stats.AvgResponseTime),
		strconv.Itoa(stats.TotalChecks),
		strconv.Itoa(stats.UpChecks),
		strconv.Itoa(stats.DownChecks),
		stats.Status,
	})
}

func (h *ReportHandler) ExportPDF(c *gin.Context) {
	// PDF generation would require a library like gofpdf or wkhtmltopdf
	// For MVP, we'll return a JSON response that can be converted to PDF on the frontend
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "PDF export coming soon. Use CSV export for now.",
	})
}

