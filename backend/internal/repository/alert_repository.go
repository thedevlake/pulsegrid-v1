package repository

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"pulsegrid/backend/internal/models"
)

type AlertRepository struct {
	db *sql.DB
}

func NewAlertRepository(db *sql.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) Create(alert *models.Alert) error {
	query := `
		INSERT INTO alerts (id, service_id, type, message, severity, is_resolved, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`

	alert.ID = uuid.New()
	alert.CreatedAt = time.Now().UTC()

	err := r.db.QueryRow(
		query,
		alert.ID, alert.ServiceID, alert.Type, alert.Message,
		alert.Severity, alert.IsResolved, alert.CreatedAt,
	).Scan(&alert.ID, &alert.CreatedAt)

	return err
}

func (r *AlertRepository) GetByID(id uuid.UUID) (*models.Alert, error) {
	query := `
		SELECT id, service_id, type, message, severity, is_resolved, resolved_at, created_at
		FROM alerts
		WHERE id = $1
	`

	alert := &models.Alert{}
	var resolvedAt sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&alert.ID, &alert.ServiceID, &alert.Type, &alert.Message,
		&alert.Severity, &alert.IsResolved, &resolvedAt, &alert.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	if resolvedAt.Valid {
		alert.ResolvedAt = &resolvedAt.Time
	}

	return alert, nil
}

func (r *AlertRepository) ListByOrganization(orgID uuid.UUID, limit int) ([]*models.Alert, error) {
	query := `
		SELECT a.id, a.service_id, a.type, a.message, a.severity, a.is_resolved, a.resolved_at, a.created_at
		FROM alerts a
		JOIN services s ON a.service_id = s.id
		WHERE s.organization_id = $1
		ORDER BY a.created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	alerts := make([]*models.Alert, 0) // Initialize as empty slice, not nil
	for rows.Next() {
		alert := &models.Alert{}
		var resolvedAt sql.NullTime

		err := rows.Scan(
			&alert.ID, &alert.ServiceID, &alert.Type, &alert.Message,
			&alert.Severity, &alert.IsResolved, &resolvedAt, &alert.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if resolvedAt.Valid {
			alert.ResolvedAt = &resolvedAt.Time
		}

		alerts = append(alerts, alert)
	}

	return alerts, rows.Err()
}

func (r *AlertRepository) Resolve(id uuid.UUID) error {
	query := `
		UPDATE alerts
		SET is_resolved = TRUE, resolved_at = $2
		WHERE id = $1
	`
	_, err := r.db.Exec(query, id, time.Now().UTC())
	return err
}

func (r *AlertRepository) GetSubscriptionsByOrganization(orgID uuid.UUID) ([]*models.AlertSubscription, error) {
	query := `
		SELECT id, organization_id, service_id, channel, destination, is_active, created_at
		FROM alert_subscriptions
		WHERE organization_id = $1 AND is_active = TRUE
	`

	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subscriptions []*models.AlertSubscription
	for rows.Next() {
		sub := &models.AlertSubscription{}
		var serviceID sql.NullString

		err := rows.Scan(
			&sub.ID, &sub.OrganizationID, &serviceID,
			&sub.Channel, &sub.Destination, &sub.IsActive, &sub.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if serviceID.Valid {
			id, _ := uuid.Parse(serviceID.String)
			sub.ServiceID = &id
		}

		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, rows.Err()
}

func (r *AlertRepository) CreateSubscription(sub *models.AlertSubscription) error {
	query := `
		INSERT INTO alert_subscriptions (id, organization_id, service_id, channel, destination, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`

	sub.ID = uuid.New()
	sub.CreatedAt = time.Now().UTC()

	err := r.db.QueryRow(
		query,
		sub.ID, sub.OrganizationID, sub.ServiceID, sub.Channel,
		sub.Destination, sub.IsActive, sub.CreatedAt,
	).Scan(&sub.ID, &sub.CreatedAt)

	return err
}

func (r *AlertRepository) DeleteSubscription(id uuid.UUID) error {
	query := `DELETE FROM alert_subscriptions WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *AlertRepository) GetSubscriptionsByService(serviceID uuid.UUID) ([]*models.AlertSubscription, error) {
	var orgID uuid.UUID
	if err := r.db.QueryRow(`SELECT organization_id FROM services WHERE id = $1`, serviceID).Scan(&orgID); err != nil {
		return nil, err
	}

	query := `
		SELECT id, organization_id, service_id, channel, destination, is_active, created_at
		FROM alert_subscriptions
		WHERE organization_id = $1
		  AND (service_id = $2 OR service_id IS NULL)
		  AND is_active = TRUE
	`

	rows, err := r.db.Query(query, orgID, serviceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subscriptions []*models.AlertSubscription
	for rows.Next() {
		sub := &models.AlertSubscription{}
		var serviceID sql.NullString

		err := rows.Scan(
			&sub.ID, &sub.OrganizationID, &serviceID,
			&sub.Channel, &sub.Destination, &sub.IsActive, &sub.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if serviceID.Valid {
			id, _ := uuid.Parse(serviceID.String)
			sub.ServiceID = &id
		}

		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, rows.Err()
}

func (r *AlertRepository) GetDB() *sql.DB {
	return r.db
}
