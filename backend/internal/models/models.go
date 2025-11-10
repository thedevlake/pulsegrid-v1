package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID `json:"id"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"-"`
	Name           string    `json:"name"`
	Role           string    `json:"role"`
	OrganizationID *uuid.UUID `json:"organization_id,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Organization struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Service struct {
	ID                uuid.UUID  `json:"id"`
	OrganizationID    uuid.UUID  `json:"organization_id"`
	Name              string     `json:"name"`
	URL               string     `json:"url"`
	Type              string     `json:"type"` // http, tcp, ping
	CheckInterval     int        `json:"check_interval"`
	Timeout           int        `json:"timeout"`
	ExpectedStatusCode *int       `json:"expected_status_code,omitempty"`
	LatencyThresholdMs *int       `json:"latency_threshold_ms,omitempty"`
	Tags              []string   `json:"tags,omitempty"`
	IsActive          bool       `json:"is_active"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type HealthCheck struct {
	ID            uuid.UUID  `json:"id"`
	ServiceID     uuid.UUID  `json:"service_id"`
	Status        string     `json:"status"` // up, down, degraded
	ResponseTimeMs *int       `json:"response_time_ms,omitempty"`
	StatusCode    *int       `json:"status_code,omitempty"`
	ErrorMessage  *string    `json:"error_message,omitempty"`
	CheckedAt     time.Time  `json:"checked_at"`
}

type Alert struct {
	ID         uuid.UUID  `json:"id"`
	ServiceID  uuid.UUID  `json:"service_id"`
	Type       string     `json:"type"` // downtime, latency, threshold
	Message    string     `json:"message"`
	Severity   string     `json:"severity"` // low, medium, high, critical
	IsResolved bool       `json:"is_resolved"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type AlertSubscription struct {
	ID             uuid.UUID  `json:"id"`
	OrganizationID uuid.UUID  `json:"organization_id"`
	ServiceID      *uuid.UUID `json:"service_id,omitempty"`
	Channel        string     `json:"channel"` // email, sms, slack
	Destination    string     `json:"destination"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
}

type ServiceStats struct {
	ServiceID      uuid.UUID `json:"service_id"`
	ServiceName    string    `json:"service_name"`
	UptimePercent  float64   `json:"uptime_percent"`
	AvgResponseTime float64   `json:"avg_response_time_ms"`
	TotalChecks    int       `json:"total_checks"`
	UpChecks       int       `json:"up_checks"`
	DownChecks     int       `json:"down_checks"`
	LastCheck      *time.Time `json:"last_check,omitempty"`
	Status         string    `json:"status"`
}

