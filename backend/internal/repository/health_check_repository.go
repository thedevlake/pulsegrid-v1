package repository

import (
	"database/sql"
	"time"

	"pulsegrid/backend/internal/models"
	"github.com/google/uuid"
)

type HealthCheckRepository struct {
	db *sql.DB
}

func NewHealthCheckRepository(db *sql.DB) *HealthCheckRepository {
	return &HealthCheckRepository{db: db}
}

func (r *HealthCheckRepository) Create(check *models.HealthCheck) error {
	query := `
		INSERT INTO health_checks (id, service_id, status, response_time_ms, status_code, error_message, checked_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, checked_at
	`
	
	check.ID = uuid.New()
	check.CheckedAt = time.Now()

	err := r.db.QueryRow(
		query,
		check.ID, check.ServiceID, check.Status, check.ResponseTimeMs,
		check.StatusCode, check.ErrorMessage, check.CheckedAt,
	).Scan(&check.ID, &check.CheckedAt)

	return err
}

func (r *HealthCheckRepository) GetByServiceID(serviceID uuid.UUID, limit int) ([]*models.HealthCheck, error) {
	query := `
		SELECT id, service_id, status, response_time_ms, status_code, error_message, checked_at
		FROM health_checks
		WHERE service_id = $1
		ORDER BY checked_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, serviceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	checks := make([]*models.HealthCheck, 0) // Initialize as empty slice, not nil
	for rows.Next() {
		check := &models.HealthCheck{}
		var responseTime, statusCode sql.NullInt64
		var errorMsg sql.NullString

		err := rows.Scan(
			&check.ID, &check.ServiceID, &check.Status,
			&responseTime, &statusCode, &errorMsg, &check.CheckedAt,
		)
		if err != nil {
			return nil, err
		}

		if responseTime.Valid {
			rt := int(responseTime.Int64)
			check.ResponseTimeMs = &rt
		}
		if statusCode.Valid {
			sc := int(statusCode.Int64)
			check.StatusCode = &sc
		}
		if errorMsg.Valid {
			check.ErrorMessage = &errorMsg.String
		}

		checks = append(checks, check)
	}

	return checks, rows.Err()
}

func (r *HealthCheckRepository) GetStatsByServiceID(serviceID uuid.UUID, since time.Time) (*models.ServiceStats, error) {
	query := `
		SELECT 
			COUNT(*) as total_checks,
			COUNT(CASE WHEN status = 'up' THEN 1 END) as up_checks,
			COUNT(CASE WHEN status = 'down' THEN 1 END) as down_checks,
			AVG(response_time_ms) as avg_response_time,
			MAX(checked_at) as last_check
		FROM health_checks
		WHERE service_id = $1 AND checked_at >= $2
	`

	stats := &models.ServiceStats{ServiceID: serviceID}
	var avgResponseTime sql.NullFloat64
	var lastCheck sql.NullTime

	err := r.db.QueryRow(query, serviceID, since).Scan(
		&stats.TotalChecks, &stats.UpChecks, &stats.DownChecks,
		&avgResponseTime, &lastCheck,
	)

	if err != nil {
		return nil, err
	}

	if avgResponseTime.Valid {
		stats.AvgResponseTime = avgResponseTime.Float64
	}
	if lastCheck.Valid {
		stats.LastCheck = &lastCheck.Time
	}

	// Calculate uptime percentage
	if stats.TotalChecks > 0 {
		stats.UptimePercent = (float64(stats.UpChecks) / float64(stats.TotalChecks)) * 100
	}

	// Determine current status from last check
	if stats.LastCheck != nil {
		lastCheckQuery := `
			SELECT status FROM health_checks
			WHERE service_id = $1
			ORDER BY checked_at DESC
			LIMIT 1
		`
		r.db.QueryRow(lastCheckQuery, serviceID).Scan(&stats.Status)
	} else {
		// No health checks yet - status is unknown
		stats.Status = "unknown"
	}

	return stats, nil
}

func (r *HealthCheckRepository) GetDB() *sql.DB {
	return r.db
}

