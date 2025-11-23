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

// Container types
const (
	ContainerTypeCompose   = "docker-compose"
	ContainerTypeContainer = "container"
	ContainerTypeTemplate  = "template"
)

// Container statuses
const (
	ContainerStatusRunning   = "running"
	ContainerStatusStopped   = "stopped"
	ContainerStatusDeploying = "deploying"
	ContainerStatusError     = "error"
	ContainerStatusPaused    = "paused"
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

// ValidContainerTypes returns a map of valid container types
func ValidContainerTypes() map[string]bool {
	return map[string]bool{
		ContainerTypeCompose:   true,
		ContainerTypeContainer: true,
		ContainerTypeTemplate:  true,
	}
}

// ValidContainerStatuses returns a map of valid container statuses
func ValidContainerStatuses() map[string]bool {
	return map[string]bool{
		ContainerStatusRunning:   true,
		ContainerStatusStopped:   true,
		ContainerStatusDeploying: true,
		ContainerStatusError:     true,
		ContainerStatusPaused:    true,
	}
}
