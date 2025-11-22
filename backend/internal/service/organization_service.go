package service

import (
	"errors"
	"fmt"

	"github.com/fahrettinrizaergin/docker-manager/internal/constants"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/fahrettinrizaergin/docker-manager/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrganizationService handles business logic for organizations
type OrganizationService struct {
	repo *repository.OrganizationRepository
}

// NewOrganizationService creates a new organization service
func NewOrganizationService(repo *repository.OrganizationRepository) *OrganizationService {
	return &OrganizationService{repo: repo}
}

// Create creates a new organization
func (s *OrganizationService) Create(org *models.Organization) error {
	// Validate required fields
	if org.Name == "" {
		return errors.New("organization name is required")
	}
	if org.Slug == "" {
		// Generate slug from name if not provided
		org.Slug = utils.GenerateSlug(org.Name)
	}
	if org.OwnerID == uuid.Nil {
		return errors.New("owner ID is required")
	}

	// Check if slug is unique
	existing, err := s.repo.GetBySlug(org.Slug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to check slug uniqueness: %w", err)
	}
	if existing != nil {
		return errors.New("organization slug already exists")
	}

	return s.repo.Create(org)
}

// GetByID retrieves an organization by ID
func (s *OrganizationService) GetByID(id uuid.UUID) (*models.Organization, error) {
	return s.repo.GetByID(id)
}

// GetBySlug retrieves an organization by slug
func (s *OrganizationService) GetBySlug(slug string) (*models.Organization, error) {
	return s.repo.GetBySlug(slug)
}

// List retrieves all organizations with pagination
func (s *OrganizationService) List(page, pageSize int) ([]models.Organization, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(pageSize, offset)
}

// ListByUserID retrieves organizations where user is a member
func (s *OrganizationService) ListByUserID(userID uuid.UUID, page, pageSize int) ([]models.Organization, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.ListByUserID(userID, pageSize, offset)
}

// Update updates an organization
func (s *OrganizationService) Update(id uuid.UUID, updates map[string]interface{}) (*models.Organization, error) {
	org, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if name, ok := updates["name"].(string); ok && name != "" {
		org.Name = name
	}
	if desc, ok := updates["description"].(string); ok {
		org.Description = desc
	}
	if avatar, ok := updates["avatar"].(string); ok {
		org.Avatar = avatar
	}
	if active, ok := updates["is_active"].(bool); ok {
		org.IsActive = active
	}
	if settings, ok := updates["settings"].(string); ok {
		org.Settings = settings
	}

	// Update slug if provided and different
	if slug, ok := updates["slug"].(string); ok && slug != "" && slug != org.Slug {
		// Check if new slug is unique
		existing, err := s.repo.GetBySlug(slug)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check slug uniqueness: %w", err)
		}
		if existing != nil && existing.ID != org.ID {
			return nil, errors.New("organization slug already exists")
		}
		org.Slug = slug
	}

	if err := s.repo.Update(org); err != nil {
		return nil, err
	}

	return org, nil
}

// Delete deletes an organization
func (s *OrganizationService) Delete(id uuid.UUID) error {
	// Check if organization exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// AddMember adds a user to an organization
func (s *OrganizationService) AddMember(orgID, userID uuid.UUID, role string) error {
	// Validate role
	if !constants.ValidOrganizationRoles()[role] {
		return errors.New("invalid role: must be owner, admin, or member")
	}

	return s.repo.AddMember(orgID, userID, role)
}

// RemoveMember removes a user from an organization
func (s *OrganizationService) RemoveMember(orgID, userID uuid.UUID) error {
	return s.repo.RemoveMember(orgID, userID)
}

// GetMembers retrieves all members of an organization
func (s *OrganizationService) GetMembers(orgID uuid.UUID) ([]models.User, error) {
	return s.repo.GetMembers(orgID)
}
