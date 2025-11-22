package service

import (
	"errors"
	"fmt"

	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/fahrettinrizaergin/docker-manager/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectService handles business logic for projects
type ProjectService struct {
	repo *repository.ProjectRepository
}

// NewProjectService creates a new project service
func NewProjectService(repo *repository.ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

// Create creates a new project
func (s *ProjectService) Create(project *models.Project) error {
	// Validate required fields
	if project.Name == "" {
		return errors.New("project name is required")
	}
	if project.Slug == "" {
		// Generate slug from name if not provided
		project.Slug = utils.GenerateSlug(project.Name)
	}
	if project.OrganizationID == uuid.Nil {
		return errors.New("organization ID is required")
	}

	// Check if slug is unique within organization
	existing, err := s.repo.GetBySlug(project.OrganizationID, project.Slug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to check slug uniqueness: %w", err)
	}
	if existing != nil {
		return errors.New("project slug already exists in this organization")
	}

	return s.repo.Create(project)
}

// GetByID retrieves a project by ID
func (s *ProjectService) GetByID(id uuid.UUID) (*models.Project, error) {
	return s.repo.GetByID(id)
}

// GetBySlug retrieves a project by organization ID and slug
func (s *ProjectService) GetBySlug(orgID uuid.UUID, slug string) (*models.Project, error) {
	return s.repo.GetBySlug(orgID, slug)
}

// List retrieves all projects with pagination
func (s *ProjectService) List(page, pageSize int) ([]models.Project, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(pageSize, offset)
}

// ListByOrganizationID retrieves projects for a specific organization
func (s *ProjectService) ListByOrganizationID(orgID uuid.UUID, page, pageSize int) ([]models.Project, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.ListByOrganizationID(orgID, pageSize, offset)
}

// Update updates a project
func (s *ProjectService) Update(id uuid.UUID, updates map[string]interface{}) (*models.Project, error) {
	project, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if name, ok := updates["name"].(string); ok && name != "" {
		project.Name = name
	}
	if desc, ok := updates["description"].(string); ok {
		project.Description = desc
	}
	if icon, ok := updates["icon"].(string); ok {
		project.Icon = icon
	}
	if status, ok := updates["status"].(string); ok {
		validStatuses := map[string]bool{"active": true, "archived": true, "suspended": true}
		if !validStatuses[status] {
			return nil, errors.New("invalid status: must be active, archived, or suspended")
		}
		project.Status = status
	}
	if settings, ok := updates["settings"].(string); ok {
		project.Settings = settings
	}

	// Update slug if provided and different
	if slug, ok := updates["slug"].(string); ok && slug != "" && slug != project.Slug {
		// Check if new slug is unique within organization
		existing, err := s.repo.GetBySlug(project.OrganizationID, slug)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check slug uniqueness: %w", err)
		}
		if existing != nil && existing.ID != project.ID {
			return nil, errors.New("project slug already exists in this organization")
		}
		project.Slug = slug
	}

	if err := s.repo.Update(project); err != nil {
		return nil, err
	}

	return project, nil
}

// Delete deletes a project
func (s *ProjectService) Delete(id uuid.UUID) error {
	// Check if project exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// CreateFolder creates a new folder in a project
func (s *ProjectService) CreateFolder(folder *models.Folder) error {
	// Validate required fields
	if folder.Name == "" {
		return errors.New("folder name is required")
	}
	if folder.ProjectID == uuid.Nil {
		return errors.New("project ID is required")
	}

	return s.repo.CreateFolder(folder)
}

// GetFolderByID retrieves a folder by ID
func (s *ProjectService) GetFolderByID(id uuid.UUID) (*models.Folder, error) {
	return s.repo.GetFolderByID(id)
}

// ListFolders retrieves all folders for a project
func (s *ProjectService) ListFolders(projectID uuid.UUID) ([]models.Folder, error) {
	return s.repo.ListFolders(projectID)
}

// UpdateFolder updates a folder
func (s *ProjectService) UpdateFolder(id uuid.UUID, updates map[string]interface{}) (*models.Folder, error) {
	folder, err := s.repo.GetFolderByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if name, ok := updates["name"].(string); ok && name != "" {
		folder.Name = name
	}
	if desc, ok := updates["description"].(string); ok {
		folder.Description = desc
	}
	if order, ok := updates["order"].(int); ok {
		folder.Order = order
	}
	if parentID, ok := updates["parent_id"].(uuid.UUID); ok {
		folder.ParentID = &parentID
	}

	if err := s.repo.UpdateFolder(folder); err != nil {
		return nil, err
	}

	return folder, nil
}

// DeleteFolder deletes a folder
func (s *ProjectService) DeleteFolder(id uuid.UUID) error {
	// Check if folder exists
	_, err := s.repo.GetFolderByID(id)
	if err != nil {
		return err
	}

	return s.repo.DeleteFolder(id)
}

// CreateEnvironment creates a new environment in a project
func (s *ProjectService) CreateEnvironment(env *models.Environment) error {
	// Validate required fields
	if env.Name == "" {
		return errors.New("environment name is required")
	}
	if env.Slug == "" {
		// Generate slug from name if not provided
		env.Slug = utils.GenerateSlug(env.Name)
	}
	if env.ProjectID == uuid.Nil {
		return errors.New("project ID is required")
	}

	return s.repo.CreateEnvironment(env)
}

// ListEnvironments retrieves all environments for a project
func (s *ProjectService) ListEnvironments(projectID uuid.UUID) ([]models.Environment, error) {
	return s.repo.ListEnvironments(projectID)
}
