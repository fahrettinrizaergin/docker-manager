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
func (r *ContainerRepository) Create(container *models.Container) error {
	return r.db.Create(container).Error
}

// GetByID retrieves a container by ID
func (r *ContainerRepository) GetByID(id uuid.UUID) (*models.Container, error) {
	var container models.Container
	err := r.db.
		Preload("Application").
		Preload("Node").
		First(&container, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &container, nil
}

// GetByContainerID retrieves a container by Docker container ID
func (r *ContainerRepository) GetByContainerID(containerID string) (*models.Container, error) {
	var container models.Container
	err := r.db.
		Preload("Application").
		Preload("Node").
		First(&container, "container_id = ?", containerID).Error
	if err != nil {
		return nil, err
	}
	return &container, nil
}

// List retrieves all containers with pagination
func (r *ContainerRepository) List(limit, offset int) ([]models.Container, int64, error) {
	var containers []models.Container
	var total int64

	// Count total
	if err := r.db.Model(&models.Container{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.
		Preload("Application").
		Preload("Node").
		Limit(limit).Offset(offset).
		Find(&containers).Error
	if err != nil {
		return nil, 0, err
	}

	return containers, total, nil
}

// ListByApplicationID retrieves containers for a specific application
func (r *ContainerRepository) ListByApplicationID(appID uuid.UUID) ([]models.Container, error) {
	var containers []models.Container
	err := r.db.
		Preload("Application").
		Preload("Node").
		Where("application_id = ?", appID).
		Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}

// ListByNodeID retrieves containers for a specific node
func (r *ContainerRepository) ListByNodeID(nodeID uuid.UUID) ([]models.Container, error) {
	var containers []models.Container
	err := r.db.
		Preload("Application").
		Preload("Node").
		Where("node_id = ?", nodeID).
		Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}

// Update updates a container
func (r *ContainerRepository) Update(container *models.Container) error {
	return r.db.Save(container).Error
}

// UpdateStatus updates the status of a container
func (r *ContainerRepository) UpdateStatus(id uuid.UUID, status string) error {
	return r.db.Model(&models.Container{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Delete soft deletes a container
func (r *ContainerRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Container{}, "id = ?", id).Error
}

// DeleteByContainerID deletes a container by Docker container ID
func (r *ContainerRepository) DeleteByContainerID(containerID string) error {
	return r.db.Delete(&models.Container{}, "container_id = ?", containerID).Error
}
