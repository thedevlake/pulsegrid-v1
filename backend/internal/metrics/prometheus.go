package metrics

import (
	"database/sql"
	"fmt"
)

// PrometheusExporter exports metrics in Prometheus format
type PrometheusExporter struct {
	db *sql.DB
}

func NewPrometheusExporter(db *sql.DB) *PrometheusExporter {
	return &PrometheusExporter{db: db}
}

// ExportMetrics exports all metrics in Prometheus format
func (e *PrometheusExporter) ExportMetrics() (string, error) {
	var output string

	// Service uptime metrics
	uptimeMetrics, err := e.getUptimeMetrics()
	if err == nil {
		output += uptimeMetrics
	}

	// Response time metrics
	responseTimeMetrics, err := e.getResponseTimeMetrics()
	if err == nil {
		output += responseTimeMetrics
	}

	// Health check status metrics
	statusMetrics, err := e.getStatusMetrics()
	if err == nil {
		output += statusMetrics
	}

	// Alert metrics
	alertMetrics, err := e.getAlertMetrics()
	if err == nil {
		output += alertMetrics
	}

	return output, nil
}

// getUptimeMetrics exports service uptime as Prometheus metrics
func (e *PrometheusExporter) getUptimeMetrics() (string, error) {
	query := `
		SELECT 
			s.id,
			s.name,
			COUNT(hc.id) as total_checks,
			COUNT(CASE WHEN hc.status = 'up' THEN 1 END) as up_checks
		FROM services s
		LEFT JOIN health_checks hc ON s.id = hc.service_id
		WHERE s.is_active = true
		GROUP BY s.id, s.name
	`

	rows, err := e.db.Query(query)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var output string
	for rows.Next() {
		var serviceID, serviceName string
		var totalChecks, upChecks int

		if err := rows.Scan(&serviceID, &serviceName, &totalChecks, &upChecks); err != nil {
			continue
		}

		uptime := 0.0
		if totalChecks > 0 {
			uptime = float64(upChecks) / float64(totalChecks) * 100
		}

		output += fmt.Sprintf(
			"pulsegrid_service_uptime_percent{service_id=\"%s\",service_name=\"%s\"} %.2f\n",
			serviceID, serviceName, uptime,
		)
		output += fmt.Sprintf(
			"pulsegrid_service_total_checks{service_id=\"%s\",service_name=\"%s\"} %d\n",
			serviceID, serviceName, totalChecks,
		)
	}

	return output, nil
}

// getResponseTimeMetrics exports response time metrics
func (e *PrometheusExporter) getResponseTimeMetrics() (string, error) {
	query := `
		SELECT 
			s.id,
			s.name,
			AVG(hc.response_time_ms) as avg_response_time,
			MIN(hc.response_time_ms) as min_response_time,
			MAX(hc.response_time_ms) as max_response_time
		FROM services s
		INNER JOIN health_checks hc ON s.id = hc.service_id
		WHERE s.is_active = true 
			AND hc.response_time_ms IS NOT NULL
			AND hc.checked_at > NOW() - INTERVAL '24 hours'
		GROUP BY s.id, s.name
	`

	rows, err := e.db.Query(query)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var output string
	for rows.Next() {
		var serviceID, serviceName string
		var avgRT, minRT, maxRT sql.NullFloat64

		if err := rows.Scan(&serviceID, &serviceName, &avgRT, &minRT, &maxRT); err != nil {
			continue
		}

		if avgRT.Valid {
			output += fmt.Sprintf(
				"pulsegrid_service_response_time_avg_ms{service_id=\"%s\",service_name=\"%s\"} %.2f\n",
				serviceID, serviceName, avgRT.Float64,
			)
		}
		if minRT.Valid {
			output += fmt.Sprintf(
				"pulsegrid_service_response_time_min_ms{service_id=\"%s\",service_name=\"%s\"} %.2f\n",
				serviceID, serviceName, minRT.Float64,
			)
		}
		if maxRT.Valid {
			output += fmt.Sprintf(
				"pulsegrid_service_response_time_max_ms{service_id=\"%s\",service_name=\"%s\"} %.2f\n",
				serviceID, serviceName, maxRT.Float64,
			)
		}
	}

	return output, nil
}

// getStatusMetrics exports health check status metrics
func (e *PrometheusExporter) getStatusMetrics() (string, error) {
	query := `
		SELECT 
			s.id,
			s.name,
			hc.status,
			COUNT(*) as count
		FROM services s
		INNER JOIN health_checks hc ON s.id = hc.service_id
		WHERE s.is_active = true 
			AND hc.checked_at > NOW() - INTERVAL '1 hour'
		GROUP BY s.id, s.name, hc.status
	`

	rows, err := e.db.Query(query)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var output string
	for rows.Next() {
		var serviceID, serviceName, status string
		var count int

		if err := rows.Scan(&serviceID, &serviceName, &status, &count); err != nil {
			continue
		}

		statusValue := 0.0
		if status == "up" {
			statusValue = 1.0
		} else if status == "down" {
			statusValue = 0.0
		} else {
			statusValue = 0.5 // degraded
		}

		output += fmt.Sprintf(
			"pulsegrid_service_status{service_id=\"%s\",service_name=\"%s\",status=\"%s\"} %.1f\n",
			serviceID, serviceName, status, statusValue,
		)
		output += fmt.Sprintf(
			"pulsegrid_service_status_count{service_id=\"%s\",service_name=\"%s\",status=\"%s\"} %d\n",
			serviceID, serviceName, status, count,
		)
	}

	return output, nil
}

// getAlertMetrics exports alert metrics
func (e *PrometheusExporter) getAlertMetrics() (string, error) {
	query := `
		SELECT 
			severity,
			COUNT(*) as count
		FROM alerts
		WHERE is_resolved = false
		GROUP BY severity
	`

	rows, err := e.db.Query(query)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var output string
	for rows.Next() {
		var severity string
		var count int

		if err := rows.Scan(&severity, &count); err != nil {
			continue
		}

		output += fmt.Sprintf(
			"pulsegrid_alerts_active{severity=\"%s\"} %d\n",
			severity, count,
		)
	}

	// Total active alerts
	totalQuery := `SELECT COUNT(*) FROM alerts WHERE is_resolved = false`
	var total int
	if err := e.db.QueryRow(totalQuery).Scan(&total); err == nil {
		output += fmt.Sprintf("pulsegrid_alerts_active_total %d\n", total)
	}

	return output, nil
}

