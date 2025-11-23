package service

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PermissionService handles business logic for permissions
type PermissionService struct {
	repo *repository.PermissionRepository
}

// NewPermissionService creates a new permission service
func NewPermissionService(repo *repository.PermissionRepository) *PermissionService {
	return &PermissionService{repo: repo}
}

// GrantPermission grants permissions to a user for a resource
func (s *PermissionService) GrantPermission(userID, resourceID uuid.UUID, resourceType string, permissions []string, grantedBy uuid.UUID, expiresAt *time.Time) error {
	// Validate resource type
	validTypes := map[string]bool{
		models.ResourceOrganization:      true,
		models.ResourceProject:           true,
		models.ResourceContainer:         true,
		models.ResourceContainerInstance: true,
	}
	if !validTypes[resourceType] {
		return errors.New("invalid resource type")
	}

	// Validate permissions
	validPerms := map[string]bool{
		models.PermissionRead:   true,
		models.PermissionWrite:  true,
		models.PermissionDelete: true,
		models.PermissionDeploy: true,
		models.PermissionManage: true,
	}
	for _, perm := range permissions {
		if !validPerms[perm] {
			return errors.New("invalid permission: " + perm)
		}
	}

	// Convert permissions to JSON
	permsJSON, err := json.Marshal(permissions)
	if err != nil {
		return err
	}

	// Check if permission already exists
	existing, err := s.repo.GetUserPermissionForResource(userID, resourceType, resourceID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if existing != nil {
		// Update existing permission
		existing.Permissions = string(permsJSON)
		existing.GrantedBy = grantedBy
		existing.ExpiresAt = expiresAt
		return s.repo.Update(existing)
	}

	// Create new permission
	permission := &models.UserPermission{
		UserID:       userID,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Permissions:  string(permsJSON),
		GrantedBy:    grantedBy,
		ExpiresAt:    expiresAt,
	}

	return s.repo.Create(permission)
}

// RevokePermission revokes a user's permission for a resource
func (s *PermissionService) RevokePermission(userID uuid.UUID, resourceType string, resourceID uuid.UUID) error {
	return s.repo.DeleteUserPermissionForResource(userID, resourceType, resourceID)
}

// GetUserPermissions retrieves all permissions for a user
func (s *PermissionService) GetUserPermissions(userID uuid.UUID) ([]models.UserPermission, error) {
	return s.repo.GetUserPermissions(userID)
}

// GetResourcePermissions retrieves all permissions for a resource
func (s *PermissionService) GetResourcePermissions(resourceType string, resourceID uuid.UUID) ([]models.UserPermission, error) {
	return s.repo.GetResourcePermissions(resourceType, resourceID)
}

// HasPermission checks if a user has a specific permission for a resource
func (s *PermissionService) HasPermission(userID uuid.UUID, resourceType string, resourceID uuid.UUID, permission string) (bool, error) {
	perm, err := s.repo.GetUserPermissionForResource(userID, resourceType, resourceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	// Check if permission is expired
	if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
		return false, nil
	}

	// Parse permissions JSON
	var permissions []string
	if err := json.Unmarshal([]byte(perm.Permissions), &permissions); err != nil {
		return false, err
	}

	// Check if permission exists
	for _, p := range permissions {
		if p == permission {
			return true, nil
		}
	}

	return false, nil
}

// GetUserOrganizations retrieves all organizations a user has access to
func (s *PermissionService) GetUserOrganizations(userID uuid.UUID) ([]uuid.UUID, error) {
	perms, err := s.repo.GetUserResourcesByType(userID, models.ResourceOrganization)
	if err != nil {
		return nil, err
	}

	orgIDs := make([]uuid.UUID, len(perms))
	for i, perm := range perms {
		// Skip expired permissions
		if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
			continue
		}
		orgIDs[i] = perm.ResourceID
	}

	return orgIDs, nil
}

// GetUserProjects retrieves all projects a user has access to
func (s *PermissionService) GetUserProjects(userID uuid.UUID) ([]uuid.UUID, error) {
	perms, err := s.repo.GetUserResourcesByType(userID, models.ResourceProject)
	if err != nil {
		return nil, err
	}

	projectIDs := make([]uuid.UUID, len(perms))
	for i, perm := range perms {
		// Skip expired permissions
		if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
			continue
		}
		projectIDs[i] = perm.ResourceID
	}

	return projectIDs, nil
}

// GetUserContainers retrieves all containers a user has access to
func (s *PermissionService) GetUserContainers(userID uuid.UUID) ([]uuid.UUID, error) {
	perms, err := s.repo.GetUserResourcesByType(userID, models.ResourceContainer)
	if err != nil {
		return nil, err
	}

	containerIDs := make([]uuid.UUID, len(perms))
	for i, perm := range perms {
		// Skip expired permissions
		if perm.ExpiresAt != nil && perm.ExpiresAt.Before(time.Now()) {
			continue
		}
		containerIDs[i] = perm.ResourceID
	}

	return containerIDs, nil
}

// UpdatePermission updates an existing permission
func (s *PermissionService) UpdatePermission(id uuid.UUID, permissions []string, expiresAt *time.Time) error {
	perm, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Validate permissions
	validPerms := map[string]bool{
		models.PermissionRead:   true,
		models.PermissionWrite:  true,
		models.PermissionDelete: true,
		models.PermissionDeploy: true,
		models.PermissionManage: true,
	}
	for _, p := range permissions {
		if !validPerms[p] {
			return errors.New("invalid permission: " + p)
		}
	}

	// Convert permissions to JSON
	permsJSON, err := json.Marshal(permissions)
	if err != nil {
		return err
	}

	perm.Permissions = string(permsJSON)
	perm.ExpiresAt = expiresAt

	return s.repo.Update(perm)
}

// DeletePermission deletes a permission by ID
func (s *PermissionService) DeletePermission(id uuid.UUID) error {
	return s.repo.Delete(id)
}
