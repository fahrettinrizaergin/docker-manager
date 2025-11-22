package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Deployment represents a deployment record
type Deployment struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID uuid.UUID `gorm:"type:uuid;not null;index" json:"application_id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Version       string    `json:"version"`
	CommitSHA     string    `json:"commit_sha"`
	Branch        string    `json:"branch"`
	Status        string    `gorm:"not null" json:"status"` // pending, building, deploying, success, failed, cancelled, rolling_back
	Strategy      string    `gorm:"default:'rolling'" json:"strategy"` // rolling, blue-green, canary
	
	// Build info
	BuildStartedAt  *time.Time `json:"build_started_at"`
	BuildFinishedAt *time.Time `json:"build_finished_at"`
	BuildDuration   int        `json:"build_duration"` // seconds
	BuildLogs       string     `gorm:"type:text" json:"build_logs,omitempty"`
	
	// Deploy info
	DeployStartedAt  *time.Time `json:"deploy_started_at"`
	DeployFinishedAt *time.Time `json:"deploy_finished_at"`
	DeployDuration   int        `json:"deploy_duration"` // seconds
	DeployLogs       string     `gorm:"type:text" json:"deploy_logs,omitempty"`
	
	// Rollback
	IsRollback      bool       `gorm:"default:false" json:"is_rollback"`
	RolledBackFrom  *uuid.UUID `gorm:"type:uuid" json:"rolled_back_from"`
	
	// Preview
	IsPreview       bool       `gorm:"default:false" json:"is_preview"`
	PreviewURL      string     `json:"preview_url"`
	
	// Metadata
	ErrorMessage    string     `json:"error_message,omitempty"`
	Metadata        string     `gorm:"type:jsonb" json:"metadata"`
	
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	User        User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (d *Deployment) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// DeploymentQueue represents a queue entry for deployments
type DeploymentQueue struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	DeploymentID  uuid.UUID `gorm:"type:uuid;not null;index" json:"deployment_id"`
	Priority      int       `gorm:"default:0" json:"priority"`
	Status        string    `gorm:"default:'queued'" json:"status"` // queued, processing, completed, failed
	ScheduledAt   *time.Time `json:"scheduled_at"`
	StartedAt     *time.Time `json:"started_at"`
	CompletedAt   *time.Time `json:"completed_at"`
	RetryCount    int       `gorm:"default:0" json:"retry_count"`
	MaxRetries    int       `gorm:"default:3" json:"max_retries"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	Deployment Deployment `gorm:"foreignKey:DeploymentID" json:"deployment,omitempty"`
}

func (dq *DeploymentQueue) BeforeCreate(tx *gorm.DB) error {
	if dq.ID == uuid.Nil {
		dq.ID = uuid.New()
	}
	return nil
}

// Webhook represents a webhook configuration
type Webhook struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID  *uuid.UUID `gorm:"type:uuid;index" json:"application_id"`
	ProjectID      *uuid.UUID `gorm:"type:uuid;index" json:"project_id"`
	OrganizationID uuid.UUID  `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string     `gorm:"not null" json:"name"`
	Type           string     `gorm:"not null" json:"type"` // gitlab, bitbucket, github, gitea, generic
	URL            string     `gorm:"not null" json:"url"`
	Secret         string     `json:"secret,omitempty"`
	Events         string     `gorm:"type:jsonb" json:"events"` // push, pull_request, tag, release
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	
	// Trigger settings
	AutoDeploy     bool       `gorm:"default:true" json:"auto_deploy"`
	Branches       string     `gorm:"type:jsonb" json:"branches"` // Branches to trigger on
	
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application  *Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Project      *Project     `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
}

func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

// CronJob represents a scheduled task
type CronJob struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	ApplicationID  *uuid.UUID `gorm:"type:uuid;index" json:"application_id"`
	ProjectID      *uuid.UUID `gorm:"type:uuid;index" json:"project_id"`
	OrganizationID uuid.UUID  `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string     `gorm:"not null" json:"name"`
	Description    string     `json:"description"`
	Schedule       string     `gorm:"not null" json:"schedule"` // Cron expression
	Command        string     `gorm:"not null" json:"command"`
	Container      string     `json:"container"` // Target container
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	
	// Execution info
	LastRunAt      *time.Time `json:"last_run_at"`
	NextRunAt      *time.Time `json:"next_run_at"`
	LastStatus     string     `json:"last_status"` // success, failed
	LastOutput     string     `gorm:"type:text" json:"last_output,omitempty"`
	
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Application  *Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Project      *Project     `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
}

func (c *CronJob) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Template represents an application template
type Template struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Category    string    `json:"category"` // database, web-server, cms, analytics, etc.
	Author      string    `json:"author"`
	Repository  string    `json:"repository"`
	DockerCompose string  `gorm:"type:text;not null" json:"docker_compose"`
	EnvTemplate string    `gorm:"type:text" json:"env_template"`
	Readme      string    `gorm:"type:text" json:"readme"`
	Tags        string    `gorm:"type:jsonb" json:"tags"`
	IsOfficial  bool      `gorm:"default:false" json:"is_official"`
	IsPublic    bool      `gorm:"default:true" json:"is_public"`
	Downloads   int       `gorm:"default:0" json:"downloads"`
	Stars       int       `gorm:"default:0" json:"stars"`
	Version     string    `json:"version"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (t *Template) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// Notification represents a notification/alert
type Notification struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;index" json:"organization_id"`
	UserID         *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Type           string    `gorm:"not null" json:"type"` // deployment, error, warning, info
	Title          string    `gorm:"not null" json:"title"`
	Message        string    `gorm:"type:text" json:"message"`
	Level          string    `gorm:"default:'info'" json:"level"` // success, info, warning, error
	IsRead         bool      `gorm:"default:false" json:"is_read"`
	
	// Related entities
	ApplicationID  *uuid.UUID `gorm:"type:uuid" json:"application_id"`
	DeploymentID   *uuid.UUID `gorm:"type:uuid" json:"deployment_id"`
	
	// Metadata
	Metadata       string    `gorm:"type:jsonb" json:"metadata"`
	
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relationships
	Organization Organization  `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	User         *User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Application  *Application  `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Deployment   *Deployment   `gorm:"foreignKey:DeploymentID" json:"deployment,omitempty"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// Activity represents an audit log entry
type Activity struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;index" json:"organization_id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Action         string    `gorm:"not null" json:"action"` // create, update, delete, deploy, rollback
	EntityType     string    `gorm:"not null" json:"entity_type"` // application, project, user, etc.
	EntityID       uuid.UUID `gorm:"type:uuid" json:"entity_id"`
	Description    string    `json:"description"`
	IPAddress      string    `json:"ip_address"`
	UserAgent      string    `json:"user_agent"`
	Metadata       string    `gorm:"type:jsonb" json:"metadata"`
	CreatedAt      time.Time `json:"created_at"`

	// Relationships
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	User         User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
