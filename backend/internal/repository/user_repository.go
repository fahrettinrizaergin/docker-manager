package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "username = ?", username).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// List retrieves all users with pagination
func (r *UserRepository) List(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// Count total
	if err := r.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Limit(limit).Offset(offset).Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// Update updates a user
func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

// UpdateLastLogin updates the last login time
func (r *UserRepository) UpdateLastLogin(id uuid.UUID) error {
	now := gorm.Expr("NOW()")
	return r.db.Model(&models.User{}).
		Where("id = ?", id).
		Update("last_login_at", now).Error
}

// Delete soft deletes a user
func (r *UserRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}

// GetOrganizations retrieves organizations where user is a member
func (r *UserRepository) GetOrganizations(userID uuid.UUID) ([]models.Organization, error) {
	var orgs []models.Organization
	err := r.db.
		Joins("JOIN user_organizations ON user_organizations.organization_id = organizations.id").
		Where("user_organizations.user_id = ?", userID).
		Find(&orgs).Error
	if err != nil {
		return nil, err
	}
	return orgs, nil
}

// GetTeams retrieves teams where user is a member
func (r *UserRepository) GetTeams(userID uuid.UUID) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.
		Joins("JOIN user_teams ON user_teams.team_id = teams.id").
		Where("user_teams.user_id = ?", userID).
		Find(&teams).Error
	if err != nil {
		return nil, err
	}
	return teams, nil
}
