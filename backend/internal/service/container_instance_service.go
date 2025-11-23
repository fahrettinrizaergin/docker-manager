package service

import (
	"errors"

	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/google/uuid"
)

// ContainerInstanceService handles business logic for containers
type ContainerInstanceService struct {
	repo *repository.ContainerInstanceRepository
}

// NewContainerInstanceService creates a new container service
func NewContainerInstanceService(repo *repository.ContainerInstanceRepository) *ContainerInstanceService {
	return &ContainerInstanceService{repo: repo}
}

// Create creates a new container instance
func (s *ContainerInstanceService) Create(containerInst *models.ContainerInstance) error {
	// Validate required fields
	if containerInst.Name == "" {
		return errors.New("container instance name is required")
	}
	if containerInst.DockerID == "" {
		return errors.New("docker ID is required")
	}
	if containerInst.ContainerID == uuid.Nil {
		return errors.New("container ID is required")
	}
	if containerInst.NodeID == uuid.Nil {
		return errors.New("node ID is required")
	}
	if containerInst.Image == "" {
		return errors.New("container image is required")
	}

	return s.repo.Create(containerInst)
}

// GetByID retrieves a container by ID
func (s *ContainerInstanceService) GetByID(id uuid.UUID) (*models.ContainerInstance, error) {
	return s.repo.GetByID(id)
}

// GetByContainerID retrieves a container by Docker container ID
func (s *ContainerInstanceService) GetByContainerID(containerID string) (*models.ContainerInstance, error) {
	return s.repo.GetByContainerID(containerID)
}

// List retrieves all containers with pagination
func (s *ContainerInstanceService) List(page, pageSize int) ([]models.ContainerInstance, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(pageSize, offset)
}

// ListByContainerID retrieves container instances for a specific container
func (s *ContainerInstanceService) ListByContainerID(containerID uuid.UUID) ([]models.ContainerInstance, error) {
	return s.repo.ListByContainerID(containerID)
}

// ListByNodeID retrieves containers for a specific node
func (s *ContainerInstanceService) ListByNodeID(nodeID uuid.UUID) ([]models.ContainerInstance, error) {
	return s.repo.ListByNodeID(nodeID)
}

// Update updates a container
func (s *ContainerInstanceService) Update(id uuid.UUID, updates map[string]interface{}) (*models.ContainerInstance, error) {
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
	if state, ok := updates["state"].(string); ok && state != "" {
		container.State = &state
	}
	if ipAddress, ok := updates["ip_address"].(string); ok {
		container.IPAddress = ipAddress
	}
	if ports, ok := updates["ports"].(string); ok && ports != "" {
		container.Ports = &ports
	}
	if networks, ok := updates["networks"].(string); ok && networks != "" {
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
func (s *ContainerInstanceService) UpdateStatus(id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(id, status)
}

// Delete deletes a container
func (s *ContainerInstanceService) Delete(id uuid.UUID) error {
	// Check if container exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// DeleteByContainerID deletes a container by Docker container ID
func (s *ContainerInstanceService) DeleteByContainerID(containerID string) error {
	return s.repo.DeleteByContainerID(containerID)
}
