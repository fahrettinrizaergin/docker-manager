package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Node represents a Docker host/node
type Node struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string    `gorm:"not null" json:"name"`
	Host           string    `gorm:"not null" json:"host"` // unix:///var/run/docker.sock or tcp://host:port
	Description    string    `json:"description"`
	Status         string    `gorm:"default:'unknown'" json:"status"` // online, offline, error, unknown
	IsDefault      bool      `gorm:"default:false" json:"is_default"`

	// Connection
	UseSSH     bool   `gorm:"default:false" json:"use_ssh"`
	SSHUser    string `json:"ssh_user"`
	SSHKey     string `gorm:"type:text" json:"ssh_key,omitempty"`
	SSHPort    int    `gorm:"default:22" json:"ssh_port"`
	TLSEnabled bool   `gorm:"default:false" json:"tls_enabled"`
	TLSCert    string `gorm:"type:text" json:"tls_cert,omitempty"`
	TLSKey     string `gorm:"type:text" json:"tls_key,omitempty"`
	TLSCA      string `gorm:"type:text" json:"tls_ca,omitempty"`

	// Metadata
	DockerVersion string `json:"docker_version"`
	OS            string `json:"os"`
	Architecture  string `json:"architecture"`
	CPUs          int    `json:"cpus"`
	Memory        int64  `json:"memory"`

	// Monitoring
	LastPingAt *time.Time `json:"last_ping_at"`

	// Labels
	Labels string `gorm:"type:jsonb" json:"labels"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Organization Organization  `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	Applications []Application `json:"applications,omitempty"`
}

func (n *Node) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// Container represents a running Docker container
type Container struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID uuid.UUID `gorm:"type:uuid;not null;index" json:"application_id"`
	NodeID        uuid.UUID `gorm:"type:uuid;not null;index" json:"node_id"`
	ContainerID   string    `gorm:"not null;index" json:"container_id"` // Docker container ID
	Name          string    `gorm:"not null" json:"name"`
	Image         string    `gorm:"not null" json:"image"`
	Status        string    `json:"status"`                  // running, stopped, paused, dead, restarting
	State         string    `gorm:"type:jsonb" json:"state"` // Detailed state from Docker

	// Runtime info
	StartedAt    *time.Time `json:"started_at"`
	FinishedAt   *time.Time `json:"finished_at"`
	RestartCount int        `gorm:"default:0" json:"restart_count"`

	// Network
	IPAddress string `json:"ip_address"`
	Ports     string `gorm:"type:jsonb" json:"ports"`
	Networks  string `gorm:"type:jsonb" json:"networks"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Node        Node        `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

func (c *Container) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Volume represents a Docker volume
type Volume struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID *uuid.UUID     `gorm:"type:uuid;index" json:"application_id"`
	NodeID        uuid.UUID      `gorm:"type:uuid;not null;index" json:"node_id"`
	VolumeID      string         `gorm:"not null" json:"volume_id"` // Docker volume ID
	Name          string         `gorm:"not null" json:"name"`
	Driver        string         `gorm:"default:'local'" json:"driver"`
	MountPath     string         `json:"mount_path"`
	HostPath      string         `json:"host_path"`
	Options       string         `gorm:"type:jsonb" json:"options"`
	Labels        string         `gorm:"type:jsonb" json:"labels"`
	Size          int64          `json:"size"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application *Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Node        Node         `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

func (v *Volume) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// Network represents a Docker network
type Network struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	NodeID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"node_id"`
	NetworkID  string         `gorm:"not null" json:"network_id"` // Docker network ID
	Name       string         `gorm:"not null" json:"name"`
	Driver     string         `gorm:"default:'bridge'" json:"driver"`
	Scope      string         `json:"scope"`
	Internal   bool           `gorm:"default:false" json:"internal"`
	Attachable bool           `gorm:"default:false" json:"attachable"`
	Options    string         `gorm:"type:jsonb" json:"options"`
	Labels     string         `gorm:"type:jsonb" json:"labels"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Node Node `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

func (n *Network) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// Image represents a Docker image
type Image struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	NodeID     uuid.UUID `gorm:"type:uuid;not null;index" json:"node_id"`
	ImageID    string    `gorm:"not null" json:"image_id"` // Docker image ID
	Repository string    `gorm:"not null" json:"repository"`
	Tag        string    `gorm:"default:'latest'" json:"tag"`
	Size       int64     `json:"size"`
	Created    time.Time `json:"created"`

	// Security scan results
	Scanned         bool       `gorm:"default:false" json:"scanned"`
	ScanDate        *time.Time `json:"scan_date"`
	Vulnerabilities string     `gorm:"type:jsonb" json:"vulnerabilities"`
	ScanStatus      string     `json:"scan_status"` // passed, failed, pending

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Node Node `gorm:"foreignKey:NodeID" json:"node,omitempty"`
}

func (i *Image) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// Registry represents a Docker registry
type Registry struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string         `gorm:"not null" json:"name"`
	Type           string         `gorm:"not null" json:"type"` // docker-hub, gitlab, harbor, ecr, gcr, custom
	URL            string         `gorm:"not null" json:"url"`
	Username       string         `json:"username"`
	Password       string         `gorm:"type:text" json:"password,omitempty"` // Encrypted
	Token          string         `gorm:"type:text" json:"token,omitempty"`    // Encrypted
	IsDefault      bool           `gorm:"default:false" json:"is_default"`
	IsPublic       bool           `gorm:"default:false" json:"is_public"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
}

func (r *Registry) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
