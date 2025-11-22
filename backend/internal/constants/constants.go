package constants

// User roles in organizations
const (
	RoleOwner  = "owner"
	RoleAdmin  = "admin"
	RoleMember = "member"
)

// Project statuses
const (
	ProjectStatusActive    = "active"
	ProjectStatusArchived  = "archived"
	ProjectStatusSuspended = "suspended"
)

// Application types
const (
	ApplicationTypeCompose   = "docker-compose"
	ApplicationTypeContainer = "container"
	ApplicationTypeTemplate  = "template"
)

// Application statuses
const (
	ApplicationStatusRunning   = "running"
	ApplicationStatusStopped   = "stopped"
	ApplicationStatusDeploying = "deploying"
	ApplicationStatusError     = "error"
	ApplicationStatusPaused    = "paused"
)

// ValidOrganizationRoles returns a map of valid organization roles
func ValidOrganizationRoles() map[string]bool {
	return map[string]bool{
		RoleOwner:  true,
		RoleAdmin:  true,
		RoleMember: true,
	}
}

// ValidProjectStatuses returns a map of valid project statuses
func ValidProjectStatuses() map[string]bool {
	return map[string]bool{
		ProjectStatusActive:    true,
		ProjectStatusArchived:  true,
		ProjectStatusSuspended: true,
	}
}

// ValidApplicationTypes returns a map of valid application types
func ValidApplicationTypes() map[string]bool {
	return map[string]bool{
		ApplicationTypeCompose:   true,
		ApplicationTypeContainer: true,
		ApplicationTypeTemplate:  true,
	}
}

// ValidApplicationStatuses returns a map of valid application statuses
func ValidApplicationStatuses() map[string]bool {
	return map[string]bool{
		ApplicationStatusRunning:   true,
		ApplicationStatusStopped:   true,
		ApplicationStatusDeploying: true,
		ApplicationStatusError:     true,
		ApplicationStatusPaused:    true,
	}
}
