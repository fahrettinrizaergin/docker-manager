package api

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/fahrettinrizaergin/docker-manager/internal/auth"
	"github.com/fahrettinrizaergin/docker-manager/internal/config"
	"github.com/fahrettinrizaergin/docker-manager/internal/constants"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Handler stubs - these will return placeholder responses
// In a real implementation, these would contain full business logic

// AuthHandler handles authentication
type AuthHandler struct {
	cfg         *config.Config
	userService *service.UserService
}

func NewAuthHandler(cfg *config.Config, userService *service.UserService) *AuthHandler {
	return &AuthHandler{
		cfg:         cfg,
		userService: userService,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email     string `json:"email" binding:"required,email"`
		Username  string `json:"username" binding:"required"`
		Password  string `json:"password" binding:"required,min=8"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         "user",
		IsActive:     true,
	}

	if err := h.userService.Create(user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate token
	token, err := auth.GenerateToken(user.ID, user.Email, user.Role, h.cfg.App.JWTSecret, 24*7) // 7 days
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Get user by email
	user, err := h.userService.GetByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is disabled"})
		return
	}

	// Update last login
	_ = h.userService.UpdateLastLogin(user.ID)

	// Generate token
	token, err := auth.GenerateToken(user.ID, user.Email, user.Role, h.cfg.App.JWTSecret, 24*7) // 7 days
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	user, err := h.userService.GetByID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Generate new token
	token, err := auth.GenerateToken(user.ID, user.Email, user.Role, h.cfg.App.JWTSecret, 24*7) // 7 days
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}

func (h *AuthHandler) RequestPasswordReset(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Get user by email
	user, err := h.userService.GetByEmail(req.Email)
	if err != nil {
		// Don't reveal whether user exists or not for security
		c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a password reset link will be sent"})
		return
	}

	// Generate reset token
	resetToken := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour) // Token valid for 24 hours

	// Create password reset record
	passwordReset := &models.PasswordReset{
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	if err := h.userService.CreatePasswordReset(passwordReset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create password reset"})
		return
	}

	// TODO: Send email with reset link
	// For now, return the token (in production, this should be sent via email)
	log.Printf("Password reset token for %s: %s", user.Email, resetToken)

	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists, a password reset link will be sent",
		// Remove this in production:
		"token": resetToken,
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Verify token
	passwordReset, err := h.userService.GetPasswordResetByToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	if passwordReset.IsExpired() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token has expired"})
		return
	}

	if passwordReset.IsUsed() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token has already been used"})
		return
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	if err := h.userService.UpdatePassword(passwordReset.UserID, hashedPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Mark token as used
	now := time.Now()
	passwordReset.UsedAt = &now
	if err := h.userService.UpdatePasswordReset(passwordReset); err != nil {
		log.Printf("Failed to mark password reset token as used: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

func (h *AuthHandler) GitLabCallback(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GitLabCallback endpoint - not implemented"})
}

func (h *AuthHandler) BitbucketCallback(c *gin.Context) {
	c.JSON(501, gin.H{"message": "BitbucketCallback endpoint - not implemented"})
}

func (h *AuthHandler) GiteaCallback(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GiteaCallback endpoint - not implemented"})
}

// UserHandler handles user operations
type UserHandler struct {
	cfg     *config.Config
	service *service.UserService
}

func NewUserHandler(cfg *config.Config, svc *service.UserService) *UserHandler {
	return &UserHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	user, err := h.service.GetByID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get user's organizations and teams
	orgs, _ := h.service.GetOrganizations(user.ID)
	teams, _ := h.service.GetTeams(user.ID)

	user.Organizations = orgs
	user.Teams = teams

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Prevent users from updating their own role
	delete(updates, "role")
	delete(updates, "is_active")

	user, err := h.service.Update(userID.(uuid.UUID), updates)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Get user
	user, err := h.service.GetByID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if !auth.CheckPassword(req.CurrentPassword, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	if err := h.service.UpdatePassword(user.ID, hashedPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	// Only admins can list users
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	users, total, err := h.service.List(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        users,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	// Only admins can update other users
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	user, err := h.service.Update(id, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	// Only admins can delete users
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// OrganizationHandler handles organization operations
type OrganizationHandler struct {
	cfg     *config.Config
	service *service.OrganizationService
}

func NewOrganizationHandler(cfg *config.Config, svc *service.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *OrganizationHandler) CreateOrganization(c *gin.Context) {
	var req models.Organization
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if err := h.service.Create(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *OrganizationHandler) ListOrganizations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	orgs, total, err := h.service.List(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        orgs,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *OrganizationHandler) GetOrganization(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	org, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization"})
		return
	}

	c.JSON(http.StatusOK, org)
}

func (h *OrganizationHandler) UpdateOrganization(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	org, err := h.service.Update(id, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, org)
}

func (h *OrganizationHandler) DeleteOrganization(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete organization"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Organization deleted successfully"})
}

func (h *OrganizationHandler) ListMembers(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	members, err := h.service.GetMembers(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch members"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": members})
}

func (h *OrganizationHandler) AddMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var req struct {
		UserID uuid.UUID `json:"user_id" binding:"required"`
		Role   string    `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.service.AddMember(id, req.UserID, req.Role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Member added successfully"})
}

func (h *OrganizationHandler) RemoveMember(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.service.RemoveMember(orgID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

// TeamHandler handles team operations
type TeamHandler struct {
	cfg *config.Config
}

func NewTeamHandler(cfg *config.Config) *TeamHandler {
	return &TeamHandler{cfg: cfg}
}

func (h *TeamHandler) CreateTeam(c *gin.Context) {
	c.JSON(501, gin.H{"message": "CreateTeam endpoint - not implemented"})
}

func (h *TeamHandler) ListTeams(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListTeams endpoint - not implemented"})
}

func (h *TeamHandler) GetTeam(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetTeam endpoint - not implemented"})
}

func (h *TeamHandler) UpdateTeam(c *gin.Context) {
	c.JSON(501, gin.H{"message": "UpdateTeam endpoint - not implemented"})
}

func (h *TeamHandler) DeleteTeam(c *gin.Context) {
	c.JSON(501, gin.H{"message": "DeleteTeam endpoint - not implemented"})
}

func (h *TeamHandler) AddMember(c *gin.Context) {
	c.JSON(501, gin.H{"message": "AddMember endpoint - not implemented"})
}

func (h *TeamHandler) RemoveMember(c *gin.Context) {
	c.JSON(501, gin.H{"message": "RemoveMember endpoint - not implemented"})
}

// ProjectHandler handles project operations
type ProjectHandler struct {
	cfg     *config.Config
	service *service.ProjectService
}

func NewProjectHandler(cfg *config.Config, svc *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req models.Project
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if err := h.service.Create(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ProjectHandler) ListProjects(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	orgIDStr := c.Query("organization_id")

	var projects []models.Project
	var total int64
	var err error

	if orgIDStr != "" {
		orgID, err := uuid.Parse(orgIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			return
		}
		projects, total, err = h.service.ListByOrganizationID(orgID, page, pageSize)
	} else {
		projects, total, err = h.service.List(page, pageSize)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        projects,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *ProjectHandler) GetProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		return
	}

	c.JSON(http.StatusOK, project)
}

func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	project, err := h.service.Update(id, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

func (h *ProjectHandler) CreateFolder(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req models.Folder
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	req.ProjectID = projectID

	if err := h.service.CreateFolder(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ProjectHandler) ListFolders(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	folders, err := h.service.ListFolders(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch folders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": folders})
}

func (h *ProjectHandler) UpdateFolder(c *gin.Context) {
	folderID, err := uuid.Parse(c.Param("folderId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid folder ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	folder, err := h.service.UpdateFolder(folderID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Folder not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, folder)
}

func (h *ProjectHandler) DeleteFolder(c *gin.Context) {
	folderID, err := uuid.Parse(c.Param("folderId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid folder ID"})
		return
	}

	if err := h.service.DeleteFolder(folderID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Folder not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete folder"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Folder deleted successfully"})
}

func (h *ProjectHandler) CreateEnvironment(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req models.Environment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	req.ProjectID = projectID

	if err := h.service.CreateEnvironment(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ProjectHandler) ListEnvironments(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	environments, err := h.service.ListEnvironments(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": environments})
}

// ContainerHandler handles application operations
type ContainerHandler struct {
	cfg     *config.Config
	service *service.ContainerService
}

func NewContainerHandler(cfg *config.Config, svc *service.ContainerService) *ContainerHandler {
	return &ContainerHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *ContainerHandler) CreateContainer(c *gin.Context) {
	var req models.Container
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if err := h.service.Create(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ContainerHandler) ListContainers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	projectIDStr := c.Query("project_id")

	var apps []models.Container
	var total int64
	var err error

	if projectIDStr != "" {
		projectID, err := uuid.Parse(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
			return
		}
		apps, total, err = h.service.ListByProjectID(projectID, page, pageSize)
	} else {
		apps, total, err = h.service.List(page, pageSize)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        apps,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *ContainerHandler) GetContainer(c *gin.Context) {
	idParam := c.Param("id")
	var app *models.Container
	var err error

	// Try to parse as UUID
	if id, err := uuid.Parse(idParam); err == nil {
		app, err = h.service.GetByID(id)
	} else {
		// If not UUID, try to get by slug if project_id is provided
		projectIDStr := c.Query("project_id")
		if projectIDStr != "" {
			if projectID, err := uuid.Parse(projectIDStr); err == nil {
				app, err = h.service.GetBySlug(projectID, idParam)
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
				return
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
			return
		}
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch container"})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (h *ContainerHandler) UpdateContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	app, err := h.service.Update(id, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (h *ContainerHandler) DeleteContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container deleted successfully"})
}

func (h *ContainerHandler) StartContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.UpdateStatus(id, constants.ContainerStatusRunning); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container started successfully"})
}

func (h *ContainerHandler) StopContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.UpdateStatus(id, constants.ContainerStatusStopped); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container stopped successfully"})
}

func (h *ContainerHandler) RestartContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	// First stop, then start
	if err := h.service.UpdateStatus(id, constants.ContainerStatusStopped); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	if err := h.service.UpdateStatus(id, constants.ContainerStatusRunning); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container restarted successfully"})
}

func (h *ContainerHandler) DeployContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.UpdateStatus(id, constants.ContainerStatusDeploying); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deploy container"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Deployment started"})
}

func (h *ContainerHandler) RollbackContainer(c *gin.Context) {
	c.JSON(501, gin.H{"message": "RollbackContainer endpoint - not implemented"})
}

func (h *ContainerHandler) ListEnvVars(c *gin.Context) {
	containerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	envVars, err := h.service.ListEnvVars(containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch environment variables"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": envVars})
}

func (h *ContainerHandler) CreateEnvVar(c *gin.Context) {
	containerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	var req models.EnvVar
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	req.ContainerID = &containerID

	if err := h.service.CreateEnvVar(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ContainerHandler) UpdateEnvVar(c *gin.Context) {
	envID, err := uuid.Parse(c.Param("envId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment variable ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	envVar, err := h.service.UpdateEnvVar(envID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment variable not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, envVar)
}

func (h *ContainerHandler) DeleteEnvVar(c *gin.Context) {
	envID, err := uuid.Parse(c.Param("envId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment variable ID"})
		return
	}

	if err := h.service.DeleteEnvVar(envID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Environment variable not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete environment variable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Environment variable deleted successfully"})
}

func (h *ContainerHandler) GetLogs(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetLogs endpoint - not implemented"})
}

func (h *ContainerHandler) GetStats(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetStats endpoint - not implemented"})
}

// NodeHandler handles node operations
type NodeHandler struct {
	cfg     *config.Config
	service *service.NodeService
}

func NewNodeHandler(cfg *config.Config, svc *service.NodeService) *NodeHandler {
	return &NodeHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *NodeHandler) CreateNode(c *gin.Context) {
	var req models.Node
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Set default status
	req.Status = "unknown"

	if err := h.service.Create(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *NodeHandler) ListNodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	nodes, total, err := h.service.List(pageSize, (page-1)*pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nodes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        nodes,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *NodeHandler) GetNode(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	node, err := h.service.Get(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch node"})
		return
	}

	c.JSON(http.StatusOK, node)
}

func (h *NodeHandler) UpdateNode(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	var req models.Node
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Ensure ID matches
	req.ID = id

	if err := h.service.Update(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

func (h *NodeHandler) DeleteNode(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete node"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Node deleted successfully"})
}

func (h *NodeHandler) TestConnection(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	if err := h.service.Ping(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Connection failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Connection successful"})
}

func (h *NodeHandler) GetStats(c *gin.Context) {
	// Placeholder for now, maybe return basic info
	c.JSON(http.StatusOK, gin.H{"message": "Stats not implemented yet"})
}

func (h *NodeHandler) Prune(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	var req struct {
		Type string `json:"type" binding:"required"` // images, containers, volumes, networks, builder, system
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.service.Prune(c.Request.Context(), id, req.Type); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Prune failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Prune successful"})
}

func (h *NodeHandler) ReloadRedis(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	if err := h.service.ReloadRedis(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Redis reload failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Redis reloaded successfully"})
}

// DeploymentHandler handles deployment operations
type DeploymentHandler struct {
	cfg *config.Config
}

func NewDeploymentHandler(cfg *config.Config) *DeploymentHandler {
	return &DeploymentHandler{cfg: cfg}
}

func (h *DeploymentHandler) ListDeployments(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListDeployments endpoint - not implemented"})
}

func (h *DeploymentHandler) GetDeployment(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetDeployment endpoint - not implemented"})
}

func (h *DeploymentHandler) CancelDeployment(c *gin.Context) {
	c.JSON(501, gin.H{"message": "CancelDeployment endpoint - not implemented"})
}

func (h *DeploymentHandler) GetLogs(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetLogs endpoint - not implemented"})
}

// TemplateHandler handles template operations
type TemplateHandler struct {
	cfg *config.Config
}

func NewTemplateHandler(cfg *config.Config) *TemplateHandler {
	return &TemplateHandler{cfg: cfg}
}

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListTemplates endpoint - not implemented"})
}

func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetTemplate endpoint - not implemented"})
}

func (h *TemplateHandler) DeployTemplate(c *gin.Context) {
	c.JSON(501, gin.H{"message": "DeployTemplate endpoint - not implemented"})
}

// RegistryHandler handles registry operations
type RegistryHandler struct {
	cfg *config.Config
}

func NewRegistryHandler(cfg *config.Config) *RegistryHandler {
	return &RegistryHandler{cfg: cfg}
}

func (h *RegistryHandler) CreateRegistry(c *gin.Context) {
	c.JSON(501, gin.H{"message": "CreateRegistry endpoint - not implemented"})
}

func (h *RegistryHandler) ListRegistries(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListRegistries endpoint - not implemented"})
}

func (h *RegistryHandler) GetRegistry(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetRegistry endpoint - not implemented"})
}

func (h *RegistryHandler) UpdateRegistry(c *gin.Context) {
	c.JSON(501, gin.H{"message": "UpdateRegistry endpoint - not implemented"})
}

func (h *RegistryHandler) DeleteRegistry(c *gin.Context) {
	c.JSON(501, gin.H{"message": "DeleteRegistry endpoint - not implemented"})
}

// WebhookHandler handles webhook operations
type WebhookHandler struct {
	cfg *config.Config
}

func NewWebhookHandler(cfg *config.Config) *WebhookHandler {
	return &WebhookHandler{cfg: cfg}
}

func (h *WebhookHandler) CreateWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "CreateWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) ListWebhooks(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListWebhooks endpoint - not implemented"})
}

func (h *WebhookHandler) GetWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) UpdateWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "UpdateWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) DeleteWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "DeleteWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) HandleGitLabWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "HandleGitLabWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) HandleBitbucketWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "HandleBitbucketWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) HandleGitHubWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "HandleGitHubWebhook endpoint - not implemented"})
}

func (h *WebhookHandler) HandleGiteaWebhook(c *gin.Context) {
	c.JSON(501, gin.H{"message": "HandleGiteaWebhook endpoint - not implemented"})
}

// CronJobHandler handles cron job operations
type CronJobHandler struct {
	cfg *config.Config
}

func NewCronJobHandler(cfg *config.Config) *CronJobHandler {
	return &CronJobHandler{cfg: cfg}
}

func (h *CronJobHandler) CreateCronJob(c *gin.Context) {
	c.JSON(501, gin.H{"message": "CreateCronJob endpoint - not implemented"})
}

func (h *CronJobHandler) ListCronJobs(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListCronJobs endpoint - not implemented"})
}

func (h *CronJobHandler) GetCronJob(c *gin.Context) {
	c.JSON(501, gin.H{"message": "GetCronJob endpoint - not implemented"})
}

func (h *CronJobHandler) UpdateCronJob(c *gin.Context) {
	c.JSON(501, gin.H{"message": "UpdateCronJob endpoint - not implemented"})
}

func (h *CronJobHandler) DeleteCronJob(c *gin.Context) {
	c.JSON(501, gin.H{"message": "DeleteCronJob endpoint - not implemented"})
}

// NotificationHandler handles notification operations
type NotificationHandler struct {
	cfg *config.Config
}

func NewNotificationHandler(cfg *config.Config) *NotificationHandler {
	return &NotificationHandler{cfg: cfg}
}

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListNotifications endpoint - not implemented"})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	c.JSON(501, gin.H{"message": "MarkAsRead endpoint - not implemented"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	c.JSON(501, gin.H{"message": "MarkAllAsRead endpoint - not implemented"})
}

// ActivityHandler handles activity operations
type ActivityHandler struct {
	cfg *config.Config
}

func NewActivityHandler(cfg *config.Config) *ActivityHandler {
	return &ActivityHandler{cfg: cfg}
}

func (h *ActivityHandler) ListActivities(c *gin.Context) {
	c.JSON(501, gin.H{"message": "ListActivities endpoint - not implemented"})
}

// DashboardHandler handles dashboard operations
type DashboardHandler struct {
	cfg              *config.Config
	userService      *service.UserService
	orgService       *service.OrganizationService
	projectService   *service.ProjectService
	appService       *service.ContainerService
	containerService *service.ContainerService
}

func NewDashboardHandler(
	cfg *config.Config,
	userService *service.UserService,
	orgService *service.OrganizationService,
	projectService *service.ProjectService,
	appService *service.ContainerService,
	containerService *service.ContainerService,
) *DashboardHandler {
	return &DashboardHandler{
		cfg:              cfg,
		userService:      userService,
		orgService:       orgService,
		projectService:   projectService,
		appService:       appService,
		containerService: containerService,
	}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userRole, _ := c.Get("user_role")
	orgIDStr := c.Query("organization_id")

	var stats map[string]interface{}

	// If user is admin, get global stats
	if userRole.(string) == "admin" {
		// Get total counts
		_, totalUsers, _ := h.userService.List(1, 1)
		_, totalOrgs, _ := h.orgService.List(1, 1)
		_, totalProjects, _ := h.projectService.List(1, 1)
		_, totalApps, _ := h.appService.List(1, 1)
		_, totalContainers, _ := h.containerService.List(1, 1)

		// Count active containers
		activeContainers := int64(0)
		containers, _, err := h.containerService.List(1, 10000) // Get all containers
		if err == nil {
			for _, container := range containers {
				if container.Status == "running" {
					activeContainers++
				}
			}
		}

		stats = map[string]interface{}{
			"users":             totalUsers,
			"organizations":     totalOrgs,
			"projects":          totalProjects,
			"applications":      totalApps,
			"containers":        totalContainers,
			"active_containers": activeContainers,
		}
	} else {
		// Get user-specific stats
		orgs, _ := h.userService.GetOrganizations(userID.(uuid.UUID))

		var totalProjects int64 = 0
		var totalApps int64 = 0
		var totalContainers int64 = 0
		var activeContainers int64 = 0

		// If specific organization is requested
		if orgIDStr != "" {
			orgID, err := uuid.Parse(orgIDStr)
			if err == nil {
				_, totalProjects, _ = h.projectService.ListByOrganizationID(orgID, 1, 1)
				projects, _, _ := h.projectService.ListByOrganizationID(orgID, 1, 10000)

				for _, project := range projects {
					_, projectApps, _ := h.appService.ListByProjectID(project.ID, 1, 10000)
					totalApps += projectApps
				}
			}
		} else {
			// Aggregate stats across all organizations
			for _, org := range orgs {
				_, orgProjects, _ := h.projectService.ListByOrganizationID(org.ID, 1, 1)
				totalProjects += orgProjects
			}
		}

		stats = map[string]interface{}{
			"organizations":     len(orgs),
			"projects":          totalProjects,
			"applications":      totalApps,
			"containers":        totalContainers,
			"active_containers": activeContainers,
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// ContainerInstanceHandler handles container operations
type ContainerInstanceHandler struct {
	cfg     *config.Config
	service *service.ContainerInstanceService
}

func NewContainerInstanceHandler(cfg *config.Config, svc *service.ContainerInstanceService) *ContainerInstanceHandler {
	return &ContainerInstanceHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *ContainerInstanceHandler) CreateContainer(c *gin.Context) {
	var req models.ContainerInstance
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	if err := h.service.Create(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

func (h *ContainerInstanceHandler) ListContainers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	containerIDStr := c.Query("container_id")
	nodeIDStr := c.Query("node_id")

	var containers []models.ContainerInstance
	var total int64
	var err error

	if containerIDStr != "" {
		containerID, err := uuid.Parse(containerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
			return
		}
		containers, err = h.service.ListByContainerID(containerID)
		total = int64(len(containers))
	} else if nodeIDStr != "" {
		nodeID, err := uuid.Parse(nodeIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
			return
		}
		containers, err = h.service.ListByNodeID(nodeID)
		total = int64(len(containers))
	} else {
		containers, total, err = h.service.List(page, pageSize)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        containers,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

func (h *ContainerInstanceHandler) GetContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	container, err := h.service.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch container"})
		return
	}

	c.JSON(http.StatusOK, container)
}

func (h *ContainerInstanceHandler) UpdateContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	container, err := h.service.Update(id, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, container)
}

func (h *ContainerInstanceHandler) DeleteContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Container not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container deleted successfully"})
}

func (h *ContainerInstanceHandler) StartContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.UpdateStatus(id, "running"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container started successfully"})
}

func (h *ContainerInstanceHandler) StopContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	if err := h.service.UpdateStatus(id, "stopped"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container stopped successfully"})
}

func (h *ContainerInstanceHandler) RestartContainer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid container ID"})
		return
	}

	// First stop, then start
	if err := h.service.UpdateStatus(id, "stopped"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	if err := h.service.UpdateStatus(id, "running"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container restarted successfully"})
}

// PermissionHandler handles permission operations
type PermissionHandler struct {
	cfg     *config.Config
	service *service.PermissionService
}

func NewPermissionHandler(cfg *config.Config, svc *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{
		cfg:     cfg,
		service: svc,
	}
}

func (h *PermissionHandler) GrantPermission(c *gin.Context) {
	// Only admins can grant permissions
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		UserID       string   `json:"user_id" binding:"required"`
		ResourceType string   `json:"resource_type" binding:"required"`
		ResourceID   string   `json:"resource_id" binding:"required"`
		Permissions  []string `json:"permissions" binding:"required"`
		ExpiresAt    *string  `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	resourceID, err := uuid.Parse(req.ResourceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resource ID"})
		return
	}

	grantedByID, _ := c.Get("user_id")

	var expiresAt *time.Time
	if req.ExpiresAt != nil {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expires_at format"})
			return
		}
		expiresAt = &t
	}

	err = h.service.GrantPermission(userID, resourceID, req.ResourceType, req.Permissions, grantedByID.(uuid.UUID), expiresAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Permission granted successfully"})
}

func (h *PermissionHandler) RevokePermission(c *gin.Context) {
	// Only admins can revoke permissions
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		UserID       string `json:"user_id" binding:"required"`
		ResourceType string `json:"resource_type" binding:"required"`
		ResourceID   string `json:"resource_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	resourceID, err := uuid.Parse(req.ResourceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resource ID"})
		return
	}

	err = h.service.RevokePermission(userID, req.ResourceType, resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission revoked successfully"})
}

func (h *PermissionHandler) GetUserPermissions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Users can only view their own permissions unless they are admin
	currentUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if currentUserID.(uuid.UUID) != userID && userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	permissions, err := h.service.GetUserPermissions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permissions})
}

func (h *PermissionHandler) GetResourcePermissions(c *gin.Context) {
	// Only admins can view resource permissions
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	resourceType := c.Query("resource_type")
	resourceIDStr := c.Query("resource_id")

	if resourceType == "" || resourceIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "resource_type and resource_id are required"})
		return
	}

	resourceID, err := uuid.Parse(resourceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resource ID"})
		return
	}

	permissions, err := h.service.GetResourcePermissions(resourceType, resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permissions})
}

func (h *PermissionHandler) GetUserResources(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Users can only view their own resources unless they are admin
	currentUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	if currentUserID.(uuid.UUID) != userID && userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	resourceType := c.Query("type")
	if resourceType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type parameter is required"})
		return
	}

	var resourceIDs []uuid.UUID
	switch resourceType {
	case models.ResourceOrganization:
		resourceIDs, err = h.service.GetUserOrganizations(userID)
	case models.ResourceProject:
		resourceIDs, err = h.service.GetUserProjects(userID)
	case models.ResourceContainer:
		resourceIDs, err = h.service.GetUserContainers(userID)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid resource type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user resources"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resourceIDs})
}

func (h *PermissionHandler) UpdatePermission(c *gin.Context) {
	// Only admins can update permissions
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	var req struct {
		Permissions []string `json:"permissions" binding:"required"`
		ExpiresAt   *string  `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expires_at format"})
			return
		}
		expiresAt = &t
	}

	err = h.service.UpdatePermission(id, req.Permissions, expiresAt)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission updated successfully"})
}

func (h *PermissionHandler) DeletePermission(c *gin.Context) {
	// Only admins can delete permissions
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	err = h.service.DeletePermission(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission deleted successfully"})
}
