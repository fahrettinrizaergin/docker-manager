package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ApplicationRepository handles database operations for applications
type ApplicationRepository struct {
	db *gorm.DB
}

// NewApplicationRepository creates a new application repository
func NewApplicationRepository(db *gorm.DB) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

// Create creates a new application
func (r *ApplicationRepository) Create(app *models.Application) error {
	return r.db.Create(app).Error
}

// GetByID retrieves an application by ID
func (r *ApplicationRepository) GetByID(id uuid.UUID) (*models.Application, error) {
	var app models.Application
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

// GetBySlug retrieves an application by project ID and slug
func (r *ApplicationRepository) GetBySlug(projectID uuid.UUID, slug string) (*models.Application, error) {
	var app models.Application
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

// List retrieves all applications with pagination
func (r *ApplicationRepository) List(limit, offset int) ([]models.Application, int64, error) {
	var apps []models.Application
	var total int64

	// Count total
	if err := r.db.Model(&models.Application{}).Count(&total).Error; err != nil {
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

// ListByProjectID retrieves applications for a specific project
func (r *ApplicationRepository) ListByProjectID(projectID uuid.UUID, limit, offset int) ([]models.Application, int64, error) {
	var apps []models.Application
	var total int64

	// Count total
	query := r.db.Model(&models.Application{}).Where("project_id = ?", projectID)
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

// ListByFolderID retrieves applications for a specific folder
func (r *ApplicationRepository) ListByFolderID(folderID uuid.UUID) ([]models.Application, error) {
	var apps []models.Application
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

// Update updates an application
func (r *ApplicationRepository) Update(app *models.Application) error {
	return r.db.Save(app).Error
}

// UpdateStatus updates the status of an application
func (r *ApplicationRepository) UpdateStatus(id uuid.UUID, status string) error {
	return r.db.Model(&models.Application{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Delete soft deletes an application
func (r *ApplicationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Application{}, "id = ?", id).Error
}

// CreateEnvVar creates a new environment variable
func (r *ApplicationRepository) CreateEnvVar(envVar *models.EnvVar) error {
	return r.db.Create(envVar).Error
}

// GetEnvVarByID retrieves an environment variable by ID
func (r *ApplicationRepository) GetEnvVarByID(id uuid.UUID) (*models.EnvVar, error) {
	var envVar models.EnvVar
	err := r.db.First(&envVar, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &envVar, nil
}

// ListEnvVars retrieves all environment variables for an application
func (r *ApplicationRepository) ListEnvVars(appID uuid.UUID) ([]models.EnvVar, error) {
	var envVars []models.EnvVar
	err := r.db.Where("application_id = ?", appID).Find(&envVars).Error
	if err != nil {
		return nil, err
	}
	return envVars, nil
}

// UpdateEnvVar updates an environment variable
func (r *ApplicationRepository) UpdateEnvVar(envVar *models.EnvVar) error {
	return r.db.Save(envVar).Error
}

// DeleteEnvVar deletes an environment variable
func (r *ApplicationRepository) DeleteEnvVar(id uuid.UUID) error {
	return r.db.Delete(&models.EnvVar{}, "id = ?", id).Error
}

// GetContainers retrieves all containers for an application
func (r *ApplicationRepository) GetContainers(appID uuid.UUID) ([]models.Container, error) {
	var containers []models.Container
	err := r.db.Where("application_id = ?", appID).Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}
