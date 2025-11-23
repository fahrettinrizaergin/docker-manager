package repository

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ContainerInstanceRepository handles database operations for containers
type ContainerInstanceRepository struct {
	db *gorm.DB
}

// NewContainerInstanceRepository creates a new container repository
func NewContainerInstanceRepository(db *gorm.DB) *ContainerInstanceRepository {
	return &ContainerInstanceRepository{db: db}
}

// Create creates a new container
func (r *ContainerInstanceRepository) Create(container *models.ContainerInstance) error {
	return r.db.Create(container).Error
}

// GetByID retrieves a container by ID
func (r *ContainerInstanceRepository) GetByID(id uuid.UUID) (*models.ContainerInstance, error) {
	var container models.ContainerInstance
	err := r.db.
		Preload("Container").
		Preload("Node").
		First(&container, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &container, nil
}

// GetByContainerID retrieves a container by Docker container ID
func (r *ContainerInstanceRepository) GetByContainerID(containerID string) (*models.ContainerInstance, error) {
	var container models.ContainerInstance
	err := r.db.
		Preload("Container").
		Preload("Node").
		First(&container, "container_id = ?", containerID).Error
	if err != nil {
		return nil, err
	}
	return &container, nil
}

// List retrieves all containers with pagination
func (r *ContainerInstanceRepository) List(limit, offset int) ([]models.ContainerInstance, int64, error) {
	var containers []models.ContainerInstance
	var total int64

	// Count total
	if err := r.db.Model(&models.ContainerInstance{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.
		Preload("Container").
		Preload("Node").
		Limit(limit).Offset(offset).
		Find(&containers).Error
	if err != nil {
		return nil, 0, err
	}

	return containers, total, nil
}

// ListByApplicationID retrieves containers for a specific application
func (r *ContainerInstanceRepository) ListByApplicationID(appID uuid.UUID) ([]models.ContainerInstance, error) {
	var containers []models.ContainerInstance
	err := r.db.
		Preload("Container").
		Preload("Node").
		Where("application_id = ?", appID).
		Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}

// ListByNodeID retrieves containers for a specific node
func (r *ContainerInstanceRepository) ListByNodeID(nodeID uuid.UUID) ([]models.ContainerInstance, error) {
	var containers []models.ContainerInstance
	err := r.db.
		Preload("Container").
		Preload("Node").
		Where("node_id = ?", nodeID).
		Find(&containers).Error
	if err != nil {
		return nil, err
	}
	return containers, nil
}

// Update updates a container
func (r *ContainerInstanceRepository) Update(container *models.ContainerInstance) error {
	return r.db.Save(container).Error
}

// UpdateStatus updates the status of a container
func (r *ContainerInstanceRepository) UpdateStatus(id uuid.UUID, status string) error {
	return r.db.Model(&models.ContainerInstance{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Delete soft deletes a container
func (r *ContainerInstanceRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.ContainerInstance{}, "id = ?", id).Error
}

// DeleteByContainerID deletes a container by Docker container ID
func (r *ContainerInstanceRepository) DeleteByContainerID(containerID string) error {
	return r.db.Delete(&models.ContainerInstance{}, "container_id = ?", containerID).Error
}
