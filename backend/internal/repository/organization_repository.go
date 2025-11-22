package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrganizationRepository handles database operations for organizations
type OrganizationRepository struct {
	db *gorm.DB
}

// NewOrganizationRepository creates a new organization repository
func NewOrganizationRepository(db *gorm.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

// Create creates a new organization
func (r *OrganizationRepository) Create(org *models.Organization) error {
	return r.db.Create(org).Error
}

// GetByID retrieves an organization by ID
func (r *OrganizationRepository) GetByID(id uuid.UUID) (*models.Organization, error) {
	var org models.Organization
	err := r.db.Preload("Owner").First(&org, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

// GetBySlug retrieves an organization by slug
func (r *OrganizationRepository) GetBySlug(slug string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.Preload("Owner").First(&org, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

// List retrieves all organizations with pagination
func (r *OrganizationRepository) List(limit, offset int) ([]models.Organization, int64, error) {
	var orgs []models.Organization
	var total int64

	// Count total
	if err := r.db.Model(&models.Organization{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Preload("Owner").Limit(limit).Offset(offset).Find(&orgs).Error
	if err != nil {
		return nil, 0, err
	}

	return orgs, total, nil
}

// ListByUserID retrieves organizations where user is a member
func (r *OrganizationRepository) ListByUserID(userID uuid.UUID, limit, offset int) ([]models.Organization, int64, error) {
	var orgs []models.Organization
	var total int64

	// Count total
	query := r.db.Model(&models.Organization{}).
		Joins("JOIN user_organizations ON user_organizations.organization_id = organizations.id").
		Where("user_organizations.user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("Owner").Limit(limit).Offset(offset).Find(&orgs).Error
	if err != nil {
		return nil, 0, err
	}

	return orgs, total, nil
}

// Update updates an organization
func (r *OrganizationRepository) Update(org *models.Organization) error {
	return r.db.Save(org).Error
}

// Delete soft deletes an organization
func (r *OrganizationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Organization{}, "id = ?", id).Error
}

// AddMember adds a user to an organization
func (r *OrganizationRepository) AddMember(orgID, userID uuid.UUID, role string) error {
	member := models.UserOrganization{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           role,
	}
	return r.db.Create(&member).Error
}

// RemoveMember removes a user from an organization
func (r *OrganizationRepository) RemoveMember(orgID, userID uuid.UUID) error {
	return r.db.Where("organization_id = ? AND user_id = ?", orgID, userID).
		Delete(&models.UserOrganization{}).Error
}

// GetMembers retrieves all members of an organization
func (r *OrganizationRepository) GetMembers(orgID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := r.db.
		Joins("JOIN user_organizations ON user_organizations.user_id = users.id").
		Where("user_organizations.organization_id = ?", orgID).
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}
