package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectRepository handles database operations for projects
type ProjectRepository struct {
	db *gorm.DB
}

// NewProjectRepository creates a new project repository
func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// Create creates a new project
func (r *ProjectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

// GetByID retrieves a project by ID
func (r *ProjectRepository) GetByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.Preload("Organization").First(&project, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// GetBySlug retrieves a project by organization ID and slug
func (r *ProjectRepository) GetBySlug(orgID uuid.UUID, slug string) (*models.Project, error) {
	var project models.Project
	err := r.db.Preload("Organization").
		First(&project, "organization_id = ? AND slug = ?", orgID, slug).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

// List retrieves all projects with pagination
func (r *ProjectRepository) List(limit, offset int) ([]models.Project, int64, error) {
	var projects []models.Project
	var total int64

	// Count total
	if err := r.db.Model(&models.Project{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Preload("Organization").Limit(limit).Offset(offset).Find(&projects).Error
	if err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

// ListByOrganizationID retrieves projects for a specific organization
func (r *ProjectRepository) ListByOrganizationID(orgID uuid.UUID, limit, offset int) ([]models.Project, int64, error) {
	var projects []models.Project
	var total int64

	// Count total
	query := r.db.Model(&models.Project{}).Where("organization_id = ?", orgID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("Organization").Limit(limit).Offset(offset).Find(&projects).Error
	if err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

// Update updates a project
func (r *ProjectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

// Delete soft deletes a project
func (r *ProjectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, "id = ?", id).Error
}

// CreateFolder creates a new folder in a project
func (r *ProjectRepository) CreateFolder(folder *models.Folder) error {
	return r.db.Create(folder).Error
}

// GetFolderByID retrieves a folder by ID
func (r *ProjectRepository) GetFolderByID(id uuid.UUID) (*models.Folder, error) {
	var folder models.Folder
	err := r.db.Preload("Project").First(&folder, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

// ListFolders retrieves all folders for a project
func (r *ProjectRepository) ListFolders(projectID uuid.UUID) ([]models.Folder, error) {
	var folders []models.Folder
	err := r.db.Where("project_id = ?", projectID).
		Order("order ASC, name ASC").
		Find(&folders).Error
	if err != nil {
		return nil, err
	}
	return folders, nil
}

// UpdateFolder updates a folder
func (r *ProjectRepository) UpdateFolder(folder *models.Folder) error {
	return r.db.Save(folder).Error
}

// DeleteFolder soft deletes a folder
func (r *ProjectRepository) DeleteFolder(id uuid.UUID) error {
	return r.db.Delete(&models.Folder{}, "id = ?", id).Error
}

// CreateEnvironment creates a new environment in a project
func (r *ProjectRepository) CreateEnvironment(env *models.Environment) error {
	return r.db.Create(env).Error
}

// ListEnvironments retrieves all environments for a project
func (r *ProjectRepository) ListEnvironments(projectID uuid.UUID) ([]models.Environment, error) {
	var environments []models.Environment
	err := r.db.Where("project_id = ?", projectID).Find(&environments).Error
	if err != nil {
		return nil, err
	}
	return environments, nil
}
