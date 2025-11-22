package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PermissionRepository handles database operations for user permissions
type PermissionRepository struct {
	db *gorm.DB
}

// NewPermissionRepository creates a new permission repository
func NewPermissionRepository(db *gorm.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

// Create creates a new user permission
func (r *PermissionRepository) Create(permission *models.UserPermission) error {
	return r.db.Create(permission).Error
}

// GetByID retrieves a permission by ID
func (r *PermissionRepository) GetByID(id uuid.UUID) (*models.UserPermission, error) {
	var permission models.UserPermission
	err := r.db.Preload("User").First(&permission, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

// GetUserPermissions retrieves all permissions for a user
func (r *PermissionRepository) GetUserPermissions(userID uuid.UUID) ([]models.UserPermission, error) {
	var permissions []models.UserPermission
	err := r.db.Where("user_id = ?", userID).Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

// GetUserPermissionForResource retrieves a user's permission for a specific resource
func (r *PermissionRepository) GetUserPermissionForResource(userID uuid.UUID, resourceType string, resourceID uuid.UUID) (*models.UserPermission, error) {
	var permission models.UserPermission
	err := r.db.First(&permission, "user_id = ? AND resource_type = ? AND resource_id = ?", userID, resourceType, resourceID).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

// GetResourcePermissions retrieves all permissions for a specific resource
func (r *PermissionRepository) GetResourcePermissions(resourceType string, resourceID uuid.UUID) ([]models.UserPermission, error) {
	var permissions []models.UserPermission
	err := r.db.Preload("User").Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

// GetUserResourcesByType retrieves all resources of a specific type that a user has access to
func (r *PermissionRepository) GetUserResourcesByType(userID uuid.UUID, resourceType string) ([]models.UserPermission, error) {
	var permissions []models.UserPermission
	err := r.db.Where("user_id = ? AND resource_type = ?", userID, resourceType).Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

// Update updates a permission
func (r *PermissionRepository) Update(permission *models.UserPermission) error {
	return r.db.Save(permission).Error
}

// Delete deletes a permission
func (r *PermissionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.UserPermission{}, "id = ?", id).Error
}

// DeleteUserPermissionForResource deletes a user's permission for a specific resource
func (r *PermissionRepository) DeleteUserPermissionForResource(userID uuid.UUID, resourceType string, resourceID uuid.UUID) error {
	return r.db.Where("user_id = ? AND resource_type = ? AND resource_id = ?", userID, resourceType, resourceID).
		Delete(&models.UserPermission{}).Error
}

// DeleteAllUserPermissions deletes all permissions for a user
func (r *PermissionRepository) DeleteAllUserPermissions(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.UserPermission{}).Error
}

// DeleteAllResourcePermissions deletes all permissions for a resource
func (r *PermissionRepository) DeleteAllResourcePermissions(resourceType string, resourceID uuid.UUID) error {
	return r.db.Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Delete(&models.UserPermission{}).Error
}
