package repository

import (
	"database/sql"
	"time"

	"pulsegrid/backend/internal/models"
	"github.com/google/uuid"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, name, role, organization_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	
	now := time.Now()
	user.ID = uuid.New()
	user.CreatedAt = now
	user.UpdatedAt = now

	err := r.db.QueryRow(
		query,
		user.ID, user.Email, user.PasswordHash, user.Name, user.Role, user.OrganizationID,
		user.CreatedAt, user.UpdatedAt,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	return err
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, organization_id, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &models.User{}
	var orgID sql.NullString

	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&orgID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if orgID.Valid {
		id, _ := uuid.Parse(orgID.String)
		user.OrganizationID = &id
	}

	return user, nil
}

func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, organization_id, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &models.User{}
	var orgID sql.NullString

	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&orgID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if orgID.Valid {
		id, _ := uuid.Parse(orgID.String)
		user.OrganizationID = &id
	}

	return user, nil
}

func (r *UserRepository) GetDB() *sql.DB {
	return r.db
}

// CountUsers returns the total number of users in the system
func (r *UserRepository) CountUsers() (int, error) {
	query := `SELECT COUNT(*) FROM users`
	var count int
	err := r.db.QueryRow(query).Scan(&count)
	return count, err
}

