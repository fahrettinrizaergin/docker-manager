package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ContainerRepository handles database operations for containers
type ContainerRepository struct {
	db *gorm.DB
}

// NewContainerRepository creates a new container repository
func NewContainerRepository(db *gorm.DB) *ContainerRepository {
	return &ContainerRepository{db: db}
}

// Create creates a new container
func (r *ContainerRepository) Create(app *models.Container) error {
	return r.db.Create(app).Error
}

// GetByID retrieves an container by ID
func (r *ContainerRepository) GetByID(id uuid.UUID) (*models.Container, error) {
	var app models.Container
	err := r.db.
		Preload("Project").
		Preload("Folder").
		Preload("Node").
		First(&app, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

// GetBySlug retrieves an container by project ID and slug
func (r *ContainerRepository) GetBySlug(projectID uuid.UUID, slug string) (*models.Container, error) {
	var app models.Container
	err := r.db.
		Preload("Project").
		Preload("Folder").
		Preload("Node").
		First(&app, "project_id = ? AND slug = ?", projectID, slug).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

// List retrieves all containers with pagination
func (r *ContainerRepository) List(limit, offset int) ([]models.Container, int64, error) {
	var apps []models.Container
	var total int64

	// Count total
	if err := r.db.Model(&models.Container{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.
		Preload("Project").
		Preload("Folder").
		Preload("Node").
		Limit(limit).Offset(offset).
		Find(&apps).Error
	if err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

// ListByProjectID retrieves containers for a specific project
func (r *ContainerRepository) ListByProjectID(projectID uuid.UUID, limit, offset int) ([]models.Container, int64, error) {
	var apps []models.Container
	var total int64

	// Count total
	query := r.db.Model(&models.Container{}).Where("project_id = ?", projectID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Project").
		Preload("Folder").
		Preload("Node").
		Limit(limit).Offset(offset).
		Find(&apps).Error
	if err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

// ListByFolderID retrieves containers for a specific folder
func (r *ContainerRepository) ListByFolderID(folderID uuid.UUID) ([]models.Container, error) {
	var apps []models.Container
	err := r.db.
		Preload("Project").
		Preload("Folder").
		Preload("Node").
		Where("folder_id = ?", folderID).
		Find(&apps).Error
	if err != nil {
		return nil, err
	}
	return apps, nil
}

// Update updates an container
func (r *ContainerRepository) Update(app *models.Container) error {
	return r.db.Save(app).Error
}

// UpdateStatus updates the status of an container
func (r *ContainerRepository) UpdateStatus(id uuid.UUID, status string) error {
	return r.db.Model(&models.Container{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Delete soft deletes an container
func (r *ContainerRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Container{}, "id = ?", id).Error
}

// CreateEnvVar creates a new environment variable
func (r *ContainerRepository) CreateEnvVar(envVar *models.EnvVar) error {
	return r.db.Create(envVar).Error
}

// GetEnvVarByID retrieves an environment variable by ID
func (r *ContainerRepository) GetEnvVarByID(id uuid.UUID) (*models.EnvVar, error) {
	var envVar models.EnvVar
	err := r.db.First(&envVar, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &envVar, nil
}

// ListEnvVars retrieves all environment variables for an container
func (r *ContainerRepository) ListEnvVars(appID uuid.UUID) ([]models.EnvVar, error) {
	var envVars []models.EnvVar
	err := r.db.Where("container_id = ?", appID).Find(&envVars).Error
	if err != nil {
		return nil, err
	}
	return envVars, nil
}

// UpdateEnvVar updates an environment variable
func (r *ContainerRepository) UpdateEnvVar(envVar *models.EnvVar) error {
	return r.db.Save(envVar).Error
}

// DeleteEnvVar deletes an environment variable
func (r *ContainerRepository) DeleteEnvVar(id uuid.UUID) error {
	return r.db.Delete(&models.EnvVar{}, "id = ?", id).Error
}

// GetContainers retrieves all containers for an container
func (r *ContainerRepository) GetContainers(appID uuid.UUID) ([]models.Container, error) {
	var containers []models.Container
	err := r.db.Where("container_id = ?", appID).Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}
