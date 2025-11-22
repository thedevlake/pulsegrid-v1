package repository

import (
	"database/sql"
	"strings"
	"time"

	"pulsegrid/backend/internal/models"
	"github.com/google/uuid"
)

type OrganizationRepository struct {
	db *sql.DB
}

func NewOrganizationRepository(db *sql.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

func (r *OrganizationRepository) Create(org *models.Organization) error {
	query := `
		INSERT INTO organizations (id, name, slug, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	
	now := time.Now().UTC()
	org.ID = uuid.New()
	org.Slug = generateSlug(org.Name)
	org.CreatedAt = now
	org.UpdatedAt = now

	err := r.db.QueryRow(
		query, org.ID, org.Name, org.Slug, org.CreatedAt, org.UpdatedAt,
	).Scan(&org.ID, &org.CreatedAt, &org.UpdatedAt)

	return err
}

func (r *OrganizationRepository) GetByID(id uuid.UUID) (*models.Organization, error) {
	query := `
		SELECT id, name, slug, created_at, updated_at
		FROM organizations
		WHERE id = $1
	`

	org := &models.Organization{}
	err := r.db.QueryRow(query, id).Scan(
		&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt,
	)

	return org, err
}

func (r *OrganizationRepository) GetBySlug(slug string) (*models.Organization, error) {
	query := `
		SELECT id, name, slug, created_at, updated_at
		FROM organizations
		WHERE slug = $1
	`

	org := &models.Organization{}
	err := r.db.QueryRow(query, slug).Scan(
		&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt,
	)

	return org, err
}

func (r *OrganizationRepository) GetDB() *sql.DB {
	return r.db
}

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	return slug
}

