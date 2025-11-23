package service

import (
	"context"
	"fmt"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/google/uuid"
)

type NodeService struct {
	repo *repository.NodeRepository
}

func NewNodeService(repo *repository.NodeRepository) *NodeService {
	return &NodeService{repo: repo}
}

func (s *NodeService) Create(node *models.Node) error {
	if node.OrganizationID == uuid.Nil {
		orgID, err := s.repo.GetDefaultOrganizationID()
		if err != nil {
			return fmt.Errorf("failed to assign organization to node: %w", err)
		}
		node.OrganizationID = orgID
	}
	return s.repo.Create(node)
}

func (s *NodeService) List(limit, offset int) ([]models.Node, int64, error) {
	return s.repo.List(limit, offset)
}

func (s *NodeService) Get(id uuid.UUID) (*models.Node, error) {
	return s.repo.GetByID(id)
}

func (s *NodeService) Update(node *models.Node) error {
	return s.repo.Update(node)
}

func (s *NodeService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}

// Helper to get Docker client for a node
func (s *NodeService) GetDockerClient(node *models.Node) (*client.Client, error) {
	opts := []client.Opt{
		client.WithAPIVersionNegotiation(),
	}

	if node.Host != "" {
		opts = append(opts, client.WithHost(node.Host))
	}

	// TODO: Handle SSH keys and TLS certs if provided
	// This requires more complex setup with http.Client and ssh.Dialer

	return client.NewClientWithOpts(opts...)
}

// Actions

func (s *NodeService) Ping(ctx context.Context, id uuid.UUID) error {
	node, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	cli, err := s.GetDockerClient(node)
	if err != nil {
		return err
	}
	defer cli.Close()

	_, err = cli.Ping(ctx)
	if err != nil {
		node.Status = "offline"
	} else {
		node.Status = "online"
		now := time.Now()
		node.LastPingAt = &now
	}
	s.repo.Update(node)
	return err
}

func (s *NodeService) Prune(ctx context.Context, id uuid.UUID, pruneType string) error {
	node, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	cli, err := s.GetDockerClient(node)
	if err != nil {
		return err
	}
	defer cli.Close()

	switch pruneType {
	case "images":
		_, err = cli.ImagesPrune(ctx, filters.Args{})
	case "containers":
		_, err = cli.ContainersPrune(ctx, filters.Args{})
	case "volumes":
		_, err = cli.VolumesPrune(ctx, filters.Args{})
	case "networks":
		_, err = cli.NetworksPrune(ctx, filters.Args{})
	case "builder":
		_, err = cli.BuildCachePrune(ctx, types.BuildCachePruneOptions{})
	case "system":
		// System prune includes containers, networks, and images (dangling)
		_, err = cli.ContainersPrune(ctx, filters.Args{})
		if err == nil {
			_, err = cli.NetworksPrune(ctx, filters.Args{})
		}
		if err == nil {
			_, err = cli.ImagesPrune(ctx, filters.Args{})
		}
	default:
		return fmt.Errorf("unknown prune type: %s", pruneType)
	}

	return err
}

// Redis Action (Placeholder - assuming Redis container named 'redis')
func (s *NodeService) ReloadRedis(ctx context.Context, id uuid.UUID) error {
	node, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	cli, err := s.GetDockerClient(node)
	if err != nil {
		return err
	}
	defer cli.Close()

	// Find redis container
	containers, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return err
	}

	var redisID string
	for _, c := range containers {
		for _, name := range c.Names {
			if name == "/redis" || name == "redis" {
				redisID = c.ID
				break
			}
		}
	}

	if redisID == "" {
		return fmt.Errorf("redis container not found")
	}

	return cli.ContainerRestart(ctx, redisID, container.StopOptions{})
}
