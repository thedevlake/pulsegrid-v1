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
		INSERT INTO users (id, email, password_hash, name, role, organization_id, email_verified, verification_token, verification_token_expires, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`
	
	now := time.Now().UTC()
	user.ID = uuid.New()
	user.CreatedAt = now
	user.UpdatedAt = now

	err := r.db.QueryRow(
		query,
		user.ID, user.Email, user.PasswordHash, user.Name, user.Role, user.OrganizationID,
		user.EmailVerified, user.VerificationToken, user.VerificationTokenExpires,
		user.CreatedAt, user.UpdatedAt,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	return err
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, organization_id, email_verified, verification_token, verification_token_expires, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &models.User{}
	var orgID sql.NullString
	var verificationToken sql.NullString
	var verificationTokenExpires sql.NullTime

	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&orgID, &user.EmailVerified, &verificationToken, &verificationTokenExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if orgID.Valid {
		id, _ := uuid.Parse(orgID.String)
		user.OrganizationID = &id
	}

	if verificationToken.Valid {
		token := verificationToken.String
		user.VerificationToken = &token
	}

	if verificationTokenExpires.Valid {
		expires := verificationTokenExpires.Time
		user.VerificationTokenExpires = &expires
	}

	return user, nil
}

func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, organization_id, email_verified, verification_token, verification_token_expires, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &models.User{}
	var orgID sql.NullString
	var verificationToken sql.NullString
	var verificationTokenExpires sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&orgID, &user.EmailVerified, &verificationToken, &verificationTokenExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if orgID.Valid {
		id, _ := uuid.Parse(orgID.String)
		user.OrganizationID = &id
	}

	if verificationToken.Valid {
		token := verificationToken.String
		user.VerificationToken = &token
	}

	if verificationTokenExpires.Valid {
		expires := verificationTokenExpires.Time
		user.VerificationTokenExpires = &expires
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

// CountUsersByOrganization returns the number of users in a specific organization
func (r *UserRepository) CountUsersByOrganization(orgID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE organization_id = $1`
	var count int
	err := r.db.QueryRow(query, orgID).Scan(&count)
	return count, err
}

// GetByVerificationToken returns a user by their verification token
func (r *UserRepository) GetByVerificationToken(token string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, role, organization_id, email_verified, verification_token, verification_token_expires, created_at, updated_at
		FROM users
		WHERE verification_token = $1
	`

	user := &models.User{}
	var orgID sql.NullString
	var verificationToken sql.NullString
	var verificationTokenExpires sql.NullTime

	err := r.db.QueryRow(query, token).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role,
		&orgID, &user.EmailVerified, &verificationToken, &verificationTokenExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if orgID.Valid {
		id, _ := uuid.Parse(orgID.String)
		user.OrganizationID = &id
	}

	if verificationToken.Valid {
		token := verificationToken.String
		user.VerificationToken = &token
	}

	if verificationTokenExpires.Valid {
		expires := verificationTokenExpires.Time
		user.VerificationTokenExpires = &expires
	}

	return user, nil
}

// VerifyEmail marks a user's email as verified
func (r *UserRepository) VerifyEmail(userID uuid.UUID) error {
	query := `
		UPDATE users
		SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL, updated_at = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(query, time.Now().UTC(), userID)
	return err
}

// UpdateVerificationToken updates the verification token for a user
func (r *UserRepository) UpdateVerificationToken(userID uuid.UUID, token string, expiresAt time.Time) error {
	query := `
		UPDATE users
		SET verification_token = $1, verification_token_expires = $2, updated_at = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(query, token, expiresAt, time.Now().UTC(), userID)
	return err
}

