package service

import (
	"errors"

	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserService handles business logic for users
type UserService struct {
	repo *repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// Create creates a new user
func (s *UserService) Create(user *models.User) error {
	// Validate required fields
	if user.Email == "" {
		return errors.New("email is required")
	}
	if user.Username == "" {
		return errors.New("username is required")
	}

	// Check if email already exists
	existing, err := s.repo.GetByEmail(user.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if existing != nil {
		return errors.New("email already exists")
	}

	// Check if username already exists
	existing, err = s.repo.GetByUsername(user.Username)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if existing != nil {
		return errors.New("username already exists")
	}

	// Set default role if not provided
	if user.Role == "" {
		user.Role = "user"
	}

	// Set default active status
	if !user.IsActive {
		user.IsActive = true
	}

	return s.repo.Create(user)
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(id uuid.UUID) (*models.User, error) {
	return s.repo.GetByID(id)
}

// GetByEmail retrieves a user by email
func (s *UserService) GetByEmail(email string) (*models.User, error) {
	return s.repo.GetByEmail(email)
}

// GetByUsername retrieves a user by username
func (s *UserService) GetByUsername(username string) (*models.User, error) {
	return s.repo.GetByUsername(username)
}

// List retrieves all users with pagination
func (s *UserService) List(page, pageSize int) ([]models.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(pageSize, offset)
}

// Update updates a user
func (s *UserService) Update(id uuid.UUID, updates map[string]interface{}) (*models.User, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if email, ok := updates["email"].(string); ok && email != "" {
		// Check if new email is unique
		existing, err := s.repo.GetByEmail(email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if existing != nil && existing.ID != user.ID {
			return nil, errors.New("email already exists")
		}
		user.Email = email
	}

	if username, ok := updates["username"].(string); ok && username != "" {
		// Check if new username is unique
		existing, err := s.repo.GetByUsername(username)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if existing != nil && existing.ID != user.ID {
			return nil, errors.New("username already exists")
		}
		user.Username = username
	}

	if firstName, ok := updates["first_name"].(string); ok {
		user.FirstName = firstName
	}
	if lastName, ok := updates["last_name"].(string); ok {
		user.LastName = lastName
	}
	if avatar, ok := updates["avatar"].(string); ok {
		user.Avatar = avatar
	}
	if role, ok := updates["role"].(string); ok {
		user.Role = role
	}
	if isActive, ok := updates["is_active"].(bool); ok {
		user.IsActive = isActive
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

// UpdateLastLogin updates the last login time
func (s *UserService) UpdateLastLogin(id uuid.UUID) error {
	return s.repo.UpdateLastLogin(id)
}

// Delete deletes a user
func (s *UserService) Delete(id uuid.UUID) error {
	// Check if user exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// GetOrganizations retrieves organizations where user is a member
func (s *UserService) GetOrganizations(userID uuid.UUID) ([]models.Organization, error) {
	return s.repo.GetOrganizations(userID)
}

// GetTeams retrieves teams where user is a member
func (s *UserService) GetTeams(userID uuid.UUID) ([]models.Team, error) {
	return s.repo.GetTeams(userID)
}

// UpdatePassword updates user password (used when user is updating their own password)
func (s *UserService) UpdatePassword(id uuid.UUID, newPasswordHash string) error {
	user, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	user.PasswordHash = newPasswordHash
	return s.repo.Update(user)
}
