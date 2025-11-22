package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Project represents a project (top-level container for folders and applications)
type Project struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string         `gorm:"not null" json:"name"`
	Slug           string         `gorm:"not null" json:"slug"`
	Description    string         `json:"description"`
	Icon           string         `json:"icon"`
	Status         string         `gorm:"default:'active'" json:"status"` // active, archived, suspended
	Settings       string         `gorm:"type:jsonb" json:"settings"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Organization Organization  `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	Teams        []Team        `gorm:"many2many:team_projects;" json:"teams,omitempty"`
	Folders      []Folder      `json:"folders,omitempty"`
	Applications []Application `json:"applications,omitempty"`
	Environments []Environment `json:"environments,omitempty"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// Folder represents a folder within a project
type Folder struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	ParentID    *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	Order       int            `gorm:"default:0" json:"order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Project      Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Parent       *Folder       `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	SubFolders   []Folder      `gorm:"foreignKey:ParentID" json:"sub_folders,omitempty"`
	Applications []Application `json:"applications,omitempty"`
}

func (f *Folder) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

// Application represents a Docker application (can be single container or compose)
type Application struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"project_id"`
	FolderID    *uuid.UUID `gorm:"type:uuid;index" json:"folder_id"`
	NodeID      *uuid.UUID `gorm:"type:uuid;index" json:"node_id"`
	Name        string     `gorm:"not null" json:"name"`
	Slug        string     `gorm:"not null" json:"slug"`
	Description string     `json:"description"`
	Type        string     `gorm:"not null" json:"type"`            // docker-compose, container, template
	Status      string     `gorm:"default:'stopped'" json:"status"` // running, stopped, deploying, error, paused

	// Deployment Configuration
	Repository     string `json:"repository"` // Git repository URL
	Branch         string `gorm:"default:'main'" json:"branch"`
	BuildPath      string `gorm:"default:'.'" json:"build_path"`
	DockerfilePath string `gorm:"default:'Dockerfile'" json:"dockerfile_path"`
	ComposeFile    string `gorm:"default:'docker-compose.yml'" json:"compose_file"`

	// Docker Configuration
	Image        string `json:"image"`
	Tag          string `gorm:"default:'latest'" json:"tag"`
	Registry     string `json:"registry"`
	RegistryAuth string `gorm:"type:text" json:"registry_auth,omitempty"` // Encrypted

	// Runtime Configuration
	Command    string `json:"command"`
	Entrypoint string `json:"entrypoint"`
	WorkingDir string `json:"working_dir"`
	User       string `json:"user"`

	// Networking
	Domain       string `json:"domain"`
	Domains      string `gorm:"type:jsonb" json:"domains"` // Additional domains
	Port         int    `json:"port"`
	InternalPort int    `json:"internal_port"`
	Protocol     string `gorm:"default:'http'" json:"protocol"` // http, https, tcp, udp

	// Resources
	CPULimit      float64 `json:"cpu_limit"`
	MemoryLimit   int64   `json:"memory_limit"` // in bytes
	CPUReserve    float64 `json:"cpu_reserve"`
	MemoryReserve int64   `json:"memory_reserve"`

	// Health Check
	HealthCheck string `gorm:"type:jsonb" json:"health_check"`

	// Auto Scaling
	AutoScale      bool    `gorm:"default:false" json:"auto_scale"`
	MinReplicas    int     `gorm:"default:1" json:"min_replicas"`
	MaxReplicas    int     `gorm:"default:1" json:"max_replicas"`
	ScaleMetric    string  `gorm:"default:'cpu'" json:"scale_metric"` // cpu, memory, requests
	ScaleThreshold float64 `gorm:"default:80" json:"scale_threshold"`

	// Deployment Strategy
	Strategy string `gorm:"default:'rolling'" json:"strategy"` // rolling, blue-green, canary

	// Settings
	RestartPolicy string `gorm:"default:'unless-stopped'" json:"restart_policy"`
	Labels        string `gorm:"type:jsonb" json:"labels"`
	Capabilities  string `gorm:"type:jsonb" json:"capabilities"`

	// Metadata
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Project     Project      `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Folder      *Folder      `gorm:"foreignKey:FolderID" json:"folder,omitempty"`
	Node        *Node        `gorm:"foreignKey:NodeID" json:"node,omitempty"`
	Containers  []Container  `json:"containers,omitempty"`
	Volumes     []Volume     `json:"volumes,omitempty"`
	EnvVars     []EnvVar     `json:"env_vars,omitempty"`
	Deployments []Deployment `json:"deployments,omitempty"`
}

func (a *Application) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// Environment represents an environment (dev, staging, prod)
type Environment struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	Name        string         `gorm:"not null" json:"name"` // dev, staging, production
	Slug        string         `gorm:"not null" json:"slug"`
	Description string         `json:"description"`
	Color       string         `json:"color"`
	IsProtected bool           `gorm:"default:false" json:"is_protected"`
	Settings    string         `gorm:"type:jsonb" json:"settings"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Project Project  `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	EnvVars []EnvVar `json:"env_vars,omitempty"`
}

func (e *Environment) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// EnvVar represents an environment variable
type EnvVar struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID *uuid.UUID     `gorm:"type:uuid;index" json:"application_id"`
	EnvironmentID *uuid.UUID     `gorm:"type:uuid;index" json:"environment_id"`
	ProjectID     *uuid.UUID     `gorm:"type:uuid;index" json:"project_id"` // For shared variables
	Key           string         `gorm:"not null" json:"key"`
	Value         string         `gorm:"type:text" json:"value,omitempty"` // Encrypted for secrets
	IsSecret      bool           `gorm:"default:false" json:"is_secret"`
	IsShared      bool           `gorm:"default:false" json:"is_shared"`
	Description   string         `json:"description"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application *Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Environment *Environment `gorm:"foreignKey:EnvironmentID" json:"environment,omitempty"`
}

func (e *EnvVar) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// TeamProject represents team-project access
type TeamProject struct {
	TeamID      uuid.UUID `gorm:"type:uuid;primaryKey" json:"team_id"`
	ProjectID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"project_id"`
	Permissions string    `gorm:"type:jsonb" json:"permissions"` // read, write, deploy, delete
	GrantedAt   time.Time `json:"granted_at"`
}
