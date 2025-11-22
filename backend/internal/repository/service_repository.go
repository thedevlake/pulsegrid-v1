package repository

import (
	"database/sql"
	"time"

	"pulsegrid/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ServiceRepository struct {
	db *sql.DB
}

func NewServiceRepository(db *sql.DB) *ServiceRepository {
	return &ServiceRepository{db: db}
}

func (r *ServiceRepository) Create(service *models.Service) error {
	query := `
		INSERT INTO services (id, organization_id, name, url, type, check_interval, timeout, expected_status_code, latency_threshold_ms, tags, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`
	
	now := time.Now().UTC()
	service.ID = uuid.New()
	service.CreatedAt = now
	service.UpdatedAt = now

	err := r.db.QueryRow(
		query,
		service.ID, service.OrganizationID, service.Name, service.URL, service.Type,
		service.CheckInterval, service.Timeout, service.ExpectedStatusCode, service.LatencyThresholdMs,
		pq.Array(service.Tags), service.IsActive, service.CreatedAt, service.UpdatedAt,
	).Scan(&service.ID, &service.CreatedAt, &service.UpdatedAt)

	return err
}

func (r *ServiceRepository) GetByID(id uuid.UUID) (*models.Service, error) {
	query := `
		SELECT id, organization_id, name, url, type, check_interval, timeout, expected_status_code, latency_threshold_ms, tags, is_active, created_at, updated_at
		FROM services
		WHERE id = $1
	`

	service := &models.Service{}
	var tags pq.StringArray
	var statusCode sql.NullInt64
	var latencyThreshold sql.NullInt64

	err := r.db.QueryRow(query, id).Scan(
		&service.ID, &service.OrganizationID, &service.Name, &service.URL, &service.Type,
		&service.CheckInterval, &service.Timeout, &statusCode, &latencyThreshold, &tags,
		&service.IsActive, &service.CreatedAt, &service.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	service.Tags = []string(tags)
	if statusCode.Valid {
		code := int(statusCode.Int64)
		service.ExpectedStatusCode = &code
	}
	if latencyThreshold.Valid {
		threshold := int(latencyThreshold.Int64)
		service.LatencyThresholdMs = &threshold
	}

	return service, nil
}

func (r *ServiceRepository) ListByOrganization(orgID uuid.UUID) ([]*models.Service, error) {
	query := `
		SELECT id, organization_id, name, url, type, check_interval, timeout, expected_status_code, latency_threshold_ms, tags, is_active, created_at, updated_at
		FROM services
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	services := make([]*models.Service, 0) // Initialize as empty slice, not nil
	for rows.Next() {
		service := &models.Service{}
		var tags pq.StringArray
		var statusCode sql.NullInt64
		var latencyThreshold sql.NullInt64

		err := rows.Scan(
			&service.ID, &service.OrganizationID, &service.Name, &service.URL, &service.Type,
			&service.CheckInterval, &service.Timeout, &statusCode, &latencyThreshold, &tags,
			&service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		service.Tags = []string(tags)
		if statusCode.Valid {
			code := int(statusCode.Int64)
			service.ExpectedStatusCode = &code
		}
		if latencyThreshold.Valid {
			threshold := int(latencyThreshold.Int64)
			service.LatencyThresholdMs = &threshold
		}

		services = append(services, service)
	}

	return services, rows.Err()
}

func (r *ServiceRepository) GetDB() *sql.DB {
	return r.db
}

func (r *ServiceRepository) Update(service *models.Service) error {
	query := `
		UPDATE services
		SET name = $2, url = $3, type = $4, check_interval = $5, timeout = $6, expected_status_code = $7, latency_threshold_ms = $8, tags = $9, is_active = $10, updated_at = $11
		WHERE id = $1
		RETURNING updated_at
	`

	service.UpdatedAt = time.Now().UTC()
	err := r.db.QueryRow(
		query,
		service.ID, service.Name, service.URL, service.Type,
		service.CheckInterval, service.Timeout, service.ExpectedStatusCode, service.LatencyThresholdMs,
		pq.Array(service.Tags), service.IsActive, service.UpdatedAt,
	).Scan(&service.UpdatedAt)

	return err
}

func (r *ServiceRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM services WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *ServiceRepository) ListActive() ([]*models.Service, error) {
	query := `
		SELECT id, organization_id, name, url, type, check_interval, timeout, expected_status_code, latency_threshold_ms, tags, is_active, created_at, updated_at
		FROM services
		WHERE is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		var tags pq.StringArray
		var statusCode sql.NullInt64
		var latencyThreshold sql.NullInt64

		err := rows.Scan(
			&service.ID, &service.OrganizationID, &service.Name, &service.URL, &service.Type,
			&service.CheckInterval, &service.Timeout, &statusCode, &latencyThreshold, &tags,
			&service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		service.Tags = []string(tags)
		if statusCode.Valid {
			code := int(statusCode.Int64)
			service.ExpectedStatusCode = &code
		}
		if latencyThreshold.Valid {
			threshold := int(latencyThreshold.Int64)
			service.LatencyThresholdMs = &threshold
		}

		services = append(services, service)
	}

	return services, rows.Err()
}

