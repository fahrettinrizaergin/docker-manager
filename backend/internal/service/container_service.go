package service

import (
	"errors"
	"fmt"

	"github.com/fahrettinrizaergin/docker-manager/internal/constants"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/fahrettinrizaergin/docker-manager/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
func (s *ContainerService) Create(app *models.Container) error {
	// Validate required fields
	if app.Name == "" {
		return errors.New("container name is required")
	}
	if app.Slug == "" {
		// Generate slug from name if not provided
		app.Slug = utils.GenerateSlug(app.Name)
	}
	if app.ProjectID == uuid.Nil {
		return errors.New("project ID is required")
	}
	if app.Type == "" {
		return errors.New("container type is required")
	}

	// Validate container type
	if !constants.ValidContainerTypes()[app.Type] {
		return errors.New("invalid container type: must be docker-compose, container, or template")
	}

	// Check if slug is unique within project
	existing, err := s.repo.GetBySlug(app.ProjectID, app.Slug)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to check slug uniqueness: %w", err)
	}
	if existing != nil {
		return errors.New("container slug already exists in this project")
	}

	// Set default status if not provided
	if app.Status == "" {
		app.Status = constants.ContainerStatusStopped
	}

	return s.repo.Create(app)
}

// GetByID retrieves an container by ID
func (s *ContainerService) GetByID(id uuid.UUID) (*models.Container, error) {
	return s.repo.GetByID(id)
}

// GetBySlug retrieves an container by project ID and slug
func (s *ContainerService) GetBySlug(projectID uuid.UUID, slug string) (*models.Container, error) {
	return s.repo.GetBySlug(projectID, slug)
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

// ListByProjectID retrieves containers for a specific project
func (s *ContainerService) ListByProjectID(projectID uuid.UUID, page, pageSize int) ([]models.Container, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.ListByProjectID(projectID, pageSize, offset)
}

// ListByFolderID retrieves containers for a specific folder
func (s *ContainerService) ListByFolderID(folderID uuid.UUID) ([]models.Container, error) {
	return s.repo.ListByFolderID(folderID)
}

// Update updates an container
func (s *ContainerService) Update(id uuid.UUID, updates map[string]interface{}) (*models.Container, error) {
	app, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Update basic fields
	if name, ok := updates["name"].(string); ok && name != "" {
		app.Name = name
	}
	if desc, ok := updates["description"].(string); ok {
		app.Description = desc
	}
	if appType, ok := updates["type"].(string); ok {
		if !constants.ValidContainerTypes()[appType] {
			return nil, errors.New("invalid container type")
		}
		app.Type = appType
	}

	// Update deployment configuration
	if repo, ok := updates["repository"].(string); ok {
		app.Repository = repo
	}
	if branch, ok := updates["branch"].(string); ok {
		app.Branch = branch
	}
	if buildPath, ok := updates["build_path"].(string); ok {
		app.BuildPath = buildPath
	}
	if dockerfilePath, ok := updates["dockerfile_path"].(string); ok {
		app.DockerfilePath = dockerfilePath
	}
	if composeFile, ok := updates["compose_file"].(string); ok {
		app.ComposeFile = composeFile
	}

	// Update Docker configuration
	if image, ok := updates["image"].(string); ok {
		app.Image = image
	}
	if tag, ok := updates["tag"].(string); ok {
		app.Tag = tag
	}
	if registry, ok := updates["registry"].(string); ok {
		app.Registry = registry
	}

	// Update runtime configuration
	if command, ok := updates["command"].(string); ok {
		app.Command = command
	}
	if entrypoint, ok := updates["entrypoint"].(string); ok {
		app.Entrypoint = entrypoint
	}
	if workingDir, ok := updates["working_dir"].(string); ok {
		app.WorkingDir = workingDir
	}
	if user, ok := updates["user"].(string); ok {
		app.User = user
	}

	// Update networking
	if domain, ok := updates["domain"].(string); ok {
		app.Domain = domain
	}
	if port, ok := updates["port"].(int); ok {
		app.Port = port
	}
	if internalPort, ok := updates["internal_port"].(int); ok {
		app.InternalPort = internalPort
	}
	if protocol, ok := updates["protocol"].(string); ok {
		app.Protocol = protocol
	}

	// Update resources
	if cpuLimit, ok := updates["cpu_limit"].(float64); ok {
		app.CPULimit = cpuLimit
	}
	if memoryLimit, ok := updates["memory_limit"].(int64); ok {
		app.MemoryLimit = memoryLimit
	}

	// Update auto scaling
	if autoScale, ok := updates["auto_scale"].(bool); ok {
		app.AutoScale = autoScale
	}
	if minReplicas, ok := updates["min_replicas"].(int); ok {
		app.MinReplicas = minReplicas
	}
	if maxReplicas, ok := updates["max_replicas"].(int); ok {
		app.MaxReplicas = maxReplicas
	}

	// Update slug if provided and different
	if slug, ok := updates["slug"].(string); ok && slug != "" && slug != app.Slug {
		// Check if new slug is unique within project
		existing, err := s.repo.GetBySlug(app.ProjectID, slug)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check slug uniqueness: %w", err)
		}
		if existing != nil && existing.ID != app.ID {
			return nil, errors.New("container slug already exists in this project")
		}
		app.Slug = slug
	}

	if err := s.repo.Update(app); err != nil {
		return nil, err
	}

	return app, nil
}

// UpdateStatus updates the status of an container
func (s *ContainerService) UpdateStatus(id uuid.UUID, status string) error {
	// Validate status
	if !constants.ValidContainerStatuses()[status] {
		return errors.New("invalid status")
	}

	return s.repo.UpdateStatus(id, status)
}

// Delete deletes an container
func (s *ContainerService) Delete(id uuid.UUID) error {
	// Check if container exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(id)
}

// CreateEnvVar creates a new environment variable
func (s *ContainerService) CreateEnvVar(envVar *models.EnvVar) error {
	// Validate required fields
	if envVar.Key == "" {
		return errors.New("environment variable key is required")
	}
	if envVar.ContainerID == nil && envVar.EnvironmentID == nil && envVar.ProjectID == nil {
		return errors.New("at least one of container_id, environment_id, or project_id is required")
	}

	return s.repo.CreateEnvVar(envVar)
}

// GetEnvVarByID retrieves an environment variable by ID
func (s *ContainerService) GetEnvVarByID(id uuid.UUID) (*models.EnvVar, error) {
	return s.repo.GetEnvVarByID(id)
}

// ListEnvVars retrieves all environment variables for an container
func (s *ContainerService) ListEnvVars(appID uuid.UUID) ([]models.EnvVar, error) {
	return s.repo.ListEnvVars(appID)
}

// UpdateEnvVar updates an environment variable
func (s *ContainerService) UpdateEnvVar(id uuid.UUID, updates map[string]interface{}) (*models.EnvVar, error) {
	envVar, err := s.repo.GetEnvVarByID(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if key, ok := updates["key"].(string); ok && key != "" {
		envVar.Key = key
	}
	if value, ok := updates["value"].(string); ok {
		envVar.Value = value
	}
	if isSecret, ok := updates["is_secret"].(bool); ok {
		envVar.IsSecret = isSecret
	}
	if isShared, ok := updates["is_shared"].(bool); ok {
		envVar.IsShared = isShared
	}
	if desc, ok := updates["description"].(string); ok {
		envVar.Description = desc
	}

	if err := s.repo.UpdateEnvVar(envVar); err != nil {
		return nil, err
	}

	return envVar, nil
}

// DeleteEnvVar deletes an environment variable
func (s *ContainerService) DeleteEnvVar(id uuid.UUID) error {
	// Check if env var exists
	_, err := s.repo.GetEnvVarByID(id)
	if err != nil {
		return err
	}

	return s.repo.DeleteEnvVar(id)
}

// GetContainers retrieves all containers for an container
func (s *ContainerService) GetContainers(appID uuid.UUID) ([]models.Container, error) {
	return s.repo.GetContainers(appID)
}
