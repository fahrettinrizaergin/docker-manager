package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Permission types
const (
	PermissionRead   = "read"
	PermissionWrite  = "write"
	PermissionDelete = "delete"
	PermissionDeploy = "deploy"
	PermissionManage = "manage"
)

// Resource types
const (
	ResourceOrganization = "organization"
	ResourceProject      = "project"
	ResourceApplication  = "application"
	ResourceContainer    = "container"
)

// UserPermission represents granular permissions for a user on a specific resource
type UserPermission struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ResourceType string         `gorm:"not null;index" json:"resource_type"` // organization, project, application, container
	ResourceID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"resource_id"`
	Permissions  string         `gorm:"type:jsonb;not null" json:"permissions"` // JSON array of permissions
	GrantedBy    uuid.UUID      `gorm:"type:uuid" json:"granted_by"`
	GrantedAt    time.Time      `json:"granted_at"`
	ExpiresAt    *time.Time     `json:"expires_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (p *UserPermission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	if p.GrantedAt.IsZero() {
		p.GrantedAt = time.Now()
	}
	return nil
}

// PermissionSet represents a set of permissions
type PermissionSet struct {
	Read   bool `json:"read"`
	Write  bool `json:"write"`
	Delete bool `json:"delete"`
	Deploy bool `json:"deploy"`
	Manage bool `json:"manage"`
}

// ToJSON converts PermissionSet to JSON string
func (ps *PermissionSet) ToJSON() string {
	perms := []string{}
	if ps.Read {
		perms = append(perms, PermissionRead)
	}
	if ps.Write {
		perms = append(perms, PermissionWrite)
	}
	if ps.Delete {
		perms = append(perms, PermissionDelete)
	}
	if ps.Deploy {
		perms = append(perms, PermissionDeploy)
	}
	if ps.Manage {
		perms = append(perms, PermissionManage)
	}
	
	// Simple JSON array construction
	result := "["
	for i, perm := range perms {
		if i > 0 {
			result += ","
		}
		result += `"` + perm + `"`
	}
	result += "]"
	return result
}

// HasPermission checks if a permission is in the set
func (ps *PermissionSet) HasPermission(permission string) bool {
	switch permission {
	case PermissionRead:
		return ps.Read
	case PermissionWrite:
		return ps.Write
	case PermissionDelete:
		return ps.Delete
	case PermissionDeploy:
		return ps.Deploy
	case PermissionManage:
		return ps.Manage
	default:
		return false
	}
}
