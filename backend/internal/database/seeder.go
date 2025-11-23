package database

import (
	"log"
	"time"

	"github.com/fahrettinrizaergin/docker-manager/internal/auth"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"github.com/fahrettinrizaergin/docker-manager/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Seed creates default data in the database
func Seed() error {
	if DB == nil {
		return nil
	}

	log.Println("Running database seeder...")

	// Check if default organization already exists
	var count int64
	DB.Model(&models.Organization{}).Where("slug = ?", "default").Count(&count)
	if count > 0 {
		log.Println("Default organization already exists, skipping seed")
		return nil
	}

	// Create default admin user
	adminPassword, err := auth.HashPassword("admin123!")
	if err != nil {
		return err
	}

	adminUser := &models.User{
		ID:           uuid.New(),
		Email:        "admin@admin.com",
		Username:     "admin",
		PasswordHash: adminPassword,
		FirstName:    "Admin",
		LastName:     "User",
		Role:         "admin",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Start transaction
	return DB.Transaction(func(tx *gorm.DB) error {
		// Create admin user
		if err := tx.Create(adminUser).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
			return err
		}
		log.Printf("Created admin user: %s", adminUser.Email)

		// Create default organization
		settings := "{}"
		defaultOrg := &models.Organization{
			ID:          uuid.New(),
			Name:        "Default Organization",
			Slug:        utils.GenerateSlug("Default Organization"),
			Description: "Default organization for Docker Manager",
			OwnerID:     adminUser.ID,
			IsActive:    true,
			Settings:    &settings,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := tx.Create(defaultOrg).Error; err != nil {
			log.Printf("Failed to create default organization: %v", err)
			return err
		}
		log.Printf("Created default organization: %s", defaultOrg.Name)

		// Add admin user to organization with owner role
		userOrg := &models.UserOrganization{
			UserID:         adminUser.ID,
			OrganizationID: defaultOrg.ID,
			Role:           "owner",
			JoinedAt:       time.Now(),
		}

		if err := tx.Create(userOrg).Error; err != nil {
			log.Printf("Failed to add admin to organization: %v", err)
			return err
		}
		log.Println("Added admin user to default organization")

		// Create a default project
		projectSettings := "{}"
		defaultProject := &models.Project{
			ID:             uuid.New(),
			OrganizationID: defaultOrg.ID,
			Name:           "Default Project",
			Slug:           utils.GenerateSlug("Default Project"),
			Description:    "Default project for getting started",
			Status:         "active",
			Settings:       &projectSettings,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		if err := tx.Create(defaultProject).Error; err != nil {
			log.Printf("Failed to create default project: %v", err)
			return err
		}
		log.Printf("Created default project: %s", defaultProject.Name)

		// Create default local node
		defaultNode := &models.Node{
			ID:             uuid.New(),
			OrganizationID: defaultOrg.ID,
			Name:           "Local Node",
			Host:           "unix:///var/run/docker.sock",
			Description:    "Default local Docker node",
			Status:         "unknown",
			IsDefault:      true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		if err := tx.Create(defaultNode).Error; err != nil {
			log.Printf("Failed to create default node: %v", err)
			return err
		}
		log.Printf("Created default node: %s", defaultNode.Name)

		log.Println("Database seeding completed successfully")
		log.Println("Default credentials:")
		log.Println("  Email: admin@admin.com")
		log.Println("  Password: admin123!")
		log.Println("IMPORTANT: Please change the default password after first login!")

		return nil
	})
}
