package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Avatar       string         `json:"avatar"`
	Role         string         `gorm:"default:'user'" json:"role"` // admin, user
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	LastLoginAt  *time.Time     `json:"last_login_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Organizations []Organization `gorm:"many2many:user_organizations;" json:"organizations,omitempty"`
	Teams         []Team         `gorm:"many2many:user_teams;" json:"teams,omitempty"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Organization represents an organization/company
type Organization struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Slug        string         `gorm:"uniqueIndex;not null" json:"slug"`
	Description string         `json:"description"`
	Avatar      string         `json:"avatar"`
	OwnerID     uuid.UUID      `gorm:"type:uuid;not null" json:"owner_id"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Settings    *string        `gorm:"type:jsonb" json:"settings,omitempty"` // JSON settings
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Owner    User      `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Users    []User    `gorm:"many2many:user_organizations;" json:"users,omitempty"`
	Teams    []Team    `json:"teams,omitempty"`
	Projects []Project `json:"projects,omitempty"`
}

func (o *Organization) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// Team represents a team within an organization
type Team struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrganizationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	Name           string         `gorm:"not null" json:"name"`
	Slug           string         `gorm:"not null" json:"slug"`
	Description    string         `json:"description"`
	Permissions    *string        `gorm:"type:jsonb" json:"permissions,omitempty"` // JSON permissions
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	Users        []User       `gorm:"many2many:user_teams;" json:"users,omitempty"`
	Projects     []Project    `gorm:"many2many:team_projects;" json:"projects,omitempty"`
}

func (t *Team) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// UserOrganization represents user-organization membership
type UserOrganization struct {
	UserID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;primaryKey" json:"organization_id"`
	Role           string    `gorm:"default:'member'" json:"role"` // owner, admin, member
	JoinedAt       time.Time `json:"joined_at"`
}

// UserTeam represents user-team membership
type UserTeam struct {
	UserID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	TeamID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"team_id"`
	Role     string    `gorm:"default:'member'" json:"role"` // lead, member
	JoinedAt time.Time `json:"joined_at"`
}
