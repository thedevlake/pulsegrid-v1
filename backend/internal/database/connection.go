package database

import (
	"database/sql"
	"fmt"
	"time"

	"pulsegrid/backend/internal/config"
	_ "github.com/lib/pq"
)

// NewConnection creates a new database connection with connection pooling
func NewConnection(cfg config.DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s timezone=UTC",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool for optimal performance
	// SetMaxOpenConns sets the maximum number of open connections to the database
	db.SetMaxOpenConns(25)
	
	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool
	db.SetMaxIdleConns(5)
	
	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused
	db.SetConnMaxLifetime(5 * time.Minute)
	
	// SetConnMaxIdleTime sets the maximum amount of time a connection may be idle
	db.SetConnMaxIdleTime(10 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

