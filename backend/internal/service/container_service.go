package service

import (
	"errors"

	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/google/uuid"
)

// ContainerService handles business logic for containers
type ContainerService struct {
	repo *repository.ContainerRepository
}

// NewContainerService creates a new container service
func NewContainerService(repo *repository.ContainerRepository) *ContainerService {
	return &ContainerService{repo: repo}
}

// Create creates a new container
func (s *ContainerService) Create(container *models.Container) error {
	// Validate required fields
	if container.Name == "" {
		return errors.New("container name is required")
	}
	if container.ContainerID == "" {
		return errors.New("container ID is required")
	}
	if container.ApplicationID == uuid.Nil {
		return errors.New("application ID is required")
	}
	if container.NodeID == uuid.Nil {
		return errors.New("node ID is required")
	}
	if container.Image == "" {
		return errors.New("container image is required")
	}

	return s.repo.Create(container)
}

// GetByID retrieves a container by ID
func (s *ContainerService) GetByID(id uuid.UUID) (*models.Container, error) {
	return s.repo.GetByID(id)
}

// GetByContainerID retrieves a container by Docker container ID
func (s *ContainerService) GetByContainerID(containerID string) (*models.Container, error) {
	return s.repo.GetByContainerID(containerID)
}

// List retrieves all containers with pagination
func (s *ContainerService) List(page, pageSize int) ([]models.Container, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(pageSize, offset)
}

// ListByApplicationID retrieves containers for a specific application
func (s *ContainerService) ListByApplicationID(appID uuid.UUID) ([]models.Container, error) {
	return s.repo.ListByApplicationID(appID)
}

// ListByNodeID retrieves containers for a specific node
func (s *ContainerService) ListByNodeID(nodeID uuid.UUID) ([]models.Container, error) {
	return s.repo.ListByNodeID(nodeID)
}

// Update updates a container
func (s *ContainerService) Update(id uuid.UUID, updates map[string]interface{}) (*models.Container, error) {
	container, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if name, ok := updates["name"].(string); ok && name != "" {
		container.Name = name
	}
	if image, ok := updates["image"].(string); ok && image != "" {
		container.Image = image
	}
	if status, ok := updates["status"].(string); ok {
		container.Status = status
	}
	if state, ok := updates["state"].(string); ok {
		container.State = &state
	}
	if ipAddress, ok := updates["ip_address"].(string); ok {
		container.IPAddress = ipAddress
	}
	if ports, ok := updates["ports"].(string); ok {
		container.Ports = &ports
	}
	if networks, ok := updates["networks"].(string); ok {
		container.Networks = &networks
	}
	if restartCount, ok := updates["restart_count"].(int); ok {
		container.RestartCount = restartCount
	}

	if err := s.repo.Update(container); err != nil {
		return nil, err
	}

	return container, nil
}

// UpdateStatus updates the status of a container
func (s *ContainerService) UpdateStatus(id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(id, status)
}

// Delete deletes a container
func (s *ContainerService) Delete(id uuid.UUID) error {
	// Check if container exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// DeleteByContainerID deletes a container by Docker container ID
func (s *ContainerService) DeleteByContainerID(containerID string) error {
	return s.repo.DeleteByContainerID(containerID)
}
