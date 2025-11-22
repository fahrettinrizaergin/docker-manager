package api

import (
	"github.com/fahrettinrizaergin/docker-manager/internal/config"
	"github.com/fahrettinrizaergin/docker-manager/internal/middleware"
	"github.com/fahrettinrizaergin/docker-manager/internal/repository"
	"github.com/fahrettinrizaergin/docker-manager/internal/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRouter sets up the HTTP router
func SetupRouter(cfg *config.Config, db *gorm.DB) *gin.Engine {
	// Initialize repositories
	orgRepo := repository.NewOrganizationRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	appRepo := repository.NewApplicationRepository(db)

	// Initialize services
	orgService := service.NewOrganizationService(orgRepo)
	projectService := service.NewProjectService(projectRepo)
	appService := service.NewApplicationService(appRepo)

	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORS(cfg))
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		auth := v1.Group("/auth")
		{
			authHandler := NewAuthHandler(cfg)
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)

			// OAuth callbacks
			if cfg.VCS.GitLab.Enabled {
				auth.GET("/gitlab/callback", authHandler.GitLabCallback)
			}
			if cfg.VCS.Bitbucket.Enabled {
				auth.GET("/bitbucket/callback", authHandler.BitbucketCallback)
			}
			if cfg.VCS.Gitea.Enabled {
				auth.GET("/gitea/callback", authHandler.GiteaCallback)
			}
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.Auth(cfg))
		{
			// User routes
			users := protected.Group("/users")
			{
				userHandler := NewUserHandler(cfg)
				users.GET("/me", userHandler.GetCurrentUser)
				users.PUT("/me", userHandler.UpdateCurrentUser)
				users.GET("", userHandler.ListUsers)
				users.GET("/:id", userHandler.GetUser)
			}

			// Organization routes
			organizations := protected.Group("/organizations")
			{
				orgHandler := NewOrganizationHandler(cfg, orgService)
				organizations.POST("", orgHandler.CreateOrganization)
				organizations.GET("", orgHandler.ListOrganizations)
				organizations.GET("/:id", orgHandler.GetOrganization)
				organizations.PUT("/:id", orgHandler.UpdateOrganization)
				organizations.DELETE("/:id", orgHandler.DeleteOrganization)

				// Organization members
				organizations.GET("/:id/members", orgHandler.ListMembers)
				organizations.POST("/:id/members", orgHandler.AddMember)
				organizations.DELETE("/:id/members/:userId", orgHandler.RemoveMember)
			}

			// Team routes
			teams := protected.Group("/teams")
			{
				teamHandler := NewTeamHandler(cfg)
				teams.POST("", teamHandler.CreateTeam)
				teams.GET("", teamHandler.ListTeams)
				teams.GET("/:id", teamHandler.GetTeam)
				teams.PUT("/:id", teamHandler.UpdateTeam)
				teams.DELETE("/:id", teamHandler.DeleteTeam)
				teams.POST("/:id/members", teamHandler.AddMember)
				teams.DELETE("/:id/members/:userId", teamHandler.RemoveMember)
			}

			// Project routes
			projects := protected.Group("/projects")
			{
				projectHandler := NewProjectHandler(cfg, projectService)
				projects.POST("", projectHandler.CreateProject)
				projects.GET("", projectHandler.ListProjects)
				projects.GET("/:id", projectHandler.GetProject)
				projects.PUT("/:id", projectHandler.UpdateProject)
				projects.DELETE("/:id", projectHandler.DeleteProject)

				// Folders
				projects.POST("/:id/folders", projectHandler.CreateFolder)
				projects.GET("/:id/folders", projectHandler.ListFolders)
				projects.PUT("/:id/folders/:folderId", projectHandler.UpdateFolder)
				projects.DELETE("/:id/folders/:folderId", projectHandler.DeleteFolder)

				// Environments
				projects.POST("/:id/environments", projectHandler.CreateEnvironment)
				projects.GET("/:id/environments", projectHandler.ListEnvironments)
			}

			// Application routes
			applications := protected.Group("/applications")
			{
				appHandler := NewApplicationHandler(cfg, appService)
				applications.POST("", appHandler.CreateApplication)
				applications.GET("", appHandler.ListApplications)
				applications.GET("/:id", appHandler.GetApplication)
				applications.PUT("/:id", appHandler.UpdateApplication)
				applications.DELETE("/:id", appHandler.DeleteApplication)

				// Application actions
				applications.POST("/:id/start", appHandler.StartApplication)
				applications.POST("/:id/stop", appHandler.StopApplication)
				applications.POST("/:id/restart", appHandler.RestartApplication)
				applications.POST("/:id/deploy", appHandler.DeployApplication)
				applications.POST("/:id/rollback", appHandler.RollbackApplication)

				// Environment variables
				applications.GET("/:id/env", appHandler.ListEnvVars)
				applications.POST("/:id/env", appHandler.CreateEnvVar)
				applications.PUT("/:id/env/:envId", appHandler.UpdateEnvVar)
				applications.DELETE("/:id/env/:envId", appHandler.DeleteEnvVar)

				// Logs
				applications.GET("/:id/logs", appHandler.GetLogs)

				// Stats
				applications.GET("/:id/stats", appHandler.GetStats)
			}

			// Node routes
			nodes := protected.Group("/nodes")
			{
				nodeHandler := NewNodeHandler(cfg)
				nodes.POST("", nodeHandler.CreateNode)
				nodes.GET("", nodeHandler.ListNodes)
				nodes.GET("/:id", nodeHandler.GetNode)
				nodes.PUT("/:id", nodeHandler.UpdateNode)
				nodes.DELETE("/:id", nodeHandler.DeleteNode)
				nodes.POST("/:id/test", nodeHandler.TestConnection)
				nodes.GET("/:id/stats", nodeHandler.GetStats)
			}

			// Deployment routes
			deployments := protected.Group("/deployments")
			{
				deployHandler := NewDeploymentHandler(cfg)
				deployments.GET("", deployHandler.ListDeployments)
				deployments.GET("/:id", deployHandler.GetDeployment)
				deployments.POST("/:id/cancel", deployHandler.CancelDeployment)
				deployments.GET("/:id/logs", deployHandler.GetLogs)
			}

			// Template routes
			templates := protected.Group("/templates")
			{
				templateHandler := NewTemplateHandler(cfg)
				templates.GET("", templateHandler.ListTemplates)
				templates.GET("/:id", templateHandler.GetTemplate)
				templates.POST("/:id/deploy", templateHandler.DeployTemplate)
			}

			// Registry routes
			registries := protected.Group("/registries")
			{
				registryHandler := NewRegistryHandler(cfg)
				registries.POST("", registryHandler.CreateRegistry)
				registries.GET("", registryHandler.ListRegistries)
				registries.GET("/:id", registryHandler.GetRegistry)
				registries.PUT("/:id", registryHandler.UpdateRegistry)
				registries.DELETE("/:id", registryHandler.DeleteRegistry)
			}

			// Webhook routes
			webhooks := protected.Group("/webhooks")
			{
				webhookHandler := NewWebhookHandler(cfg)
				webhooks.POST("", webhookHandler.CreateWebhook)
				webhooks.GET("", webhookHandler.ListWebhooks)
				webhooks.GET("/:id", webhookHandler.GetWebhook)
				webhooks.PUT("/:id", webhookHandler.UpdateWebhook)
				webhooks.DELETE("/:id", webhookHandler.DeleteWebhook)
			}

			// Cron job routes
			cronjobs := protected.Group("/cronjobs")
			{
				cronHandler := NewCronJobHandler(cfg)
				cronjobs.POST("", cronHandler.CreateCronJob)
				cronjobs.GET("", cronHandler.ListCronJobs)
				cronjobs.GET("/:id", cronHandler.GetCronJob)
				cronjobs.PUT("/:id", cronHandler.UpdateCronJob)
				cronjobs.DELETE("/:id", cronHandler.DeleteCronJob)
			}

			// Notification routes
			notifications := protected.Group("/notifications")
			{
				notifHandler := NewNotificationHandler(cfg)
				notifications.GET("", notifHandler.ListNotifications)
				notifications.PUT("/:id/read", notifHandler.MarkAsRead)
				notifications.PUT("/read-all", notifHandler.MarkAllAsRead)
			}

			// Activity routes
			activities := protected.Group("/activities")
			{
				activityHandler := NewActivityHandler(cfg)
				activities.GET("", activityHandler.ListActivities)
			}
		}

		// Webhook receivers (public endpoints with signature validation)
		webhookReceivers := v1.Group("/webhooks/receive")
		{
			webhookHandler := NewWebhookHandler(cfg)
			webhookReceivers.POST("/gitlab", webhookHandler.HandleGitLabWebhook)
			webhookReceivers.POST("/bitbucket", webhookHandler.HandleBitbucketWebhook)
			webhookReceivers.POST("/github", webhookHandler.HandleGitHubWebhook)
			webhookReceivers.POST("/gitea", webhookHandler.HandleGiteaWebhook)
		}
	}

	// WebSocket endpoint for real-time updates
	router.GET("/ws", func(c *gin.Context) {
		// WebSocket handler will be implemented
		c.JSON(200, gin.H{"message": "WebSocket endpoint"})
	})

	return router
}
