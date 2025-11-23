package database

import (
	"fmt"
	"log"

	"github.com/fahrettinrizaergin/docker-manager/internal/config"
	"github.com/fahrettinrizaergin/docker-manager/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the database connection instance
var DB *gorm.DB

// Initialize initializes the database connection
func Initialize(cfg *config.Config) error {
	var err error

	// Configure logger
	logLevel := logger.Silent
	if cfg.App.Env == "development" {
		logLevel = logger.Info
	}

	// Connect to database
	DB, err = gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL database
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	log.Println("Database connection established")

	return nil
}

// Migrate runs database migrations
func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	log.Println("Running database migrations...")

	// Run custom migrations first to fix schema issues
	if err := runCustomMigrations(); err != nil {
		return fmt.Errorf("failed to run custom migrations: %w", err)
	}

	// Auto-migrate all models
	err := DB.AutoMigrate(
		// User models
		&models.User{},
		&models.Organization{},
		&models.Team{},
		&models.UserOrganization{},
		&models.UserTeam{},
		&models.PasswordReset{},

		// Permission models
		&models.UserPermission{},

		// Project models
		&models.Project{},
		&models.Folder{},
		&models.Container{},
		&models.Environment{},
		&models.EnvVar{},
		&models.TeamProject{},

		// Docker models
		&models.Node{},
		&models.ContainerInstance{},
		&models.Volume{},
		&models.Network{},
		&models.Image{},
		&models.Registry{},

		// Deployment models
		&models.Deployment{},
		&models.DeploymentQueue{},
		&models.Webhook{},
		&models.CronJob{},
		&models.Template{},
		&models.Notification{},
		&models.Activity{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")

	return nil
}

// runCustomMigrations runs custom SQL migrations to fix schema issues
func runCustomMigrations() error {
	log.Println("Running custom migrations...")

	// Fix application_id column constraint in containers table
	// This column is a legacy field that's no longer used in the model
	// Make it nullable to prevent NOT NULL constraint violations
	if err := DB.Exec("ALTER TABLE containers ALTER COLUMN application_id DROP NOT NULL").Error; err != nil {
		// Check if the column exists
		var columnExists bool
		checkErr := DB.Raw(`
			SELECT EXISTS (
				SELECT 1 
				FROM information_schema.columns 
				WHERE table_name = 'containers' 
				AND column_name = 'application_id'
			)
		`).Scan(&columnExists).Error

		if checkErr != nil {
			log.Printf("Warning: Could not check if application_id column exists: %v", checkErr)
		} else if !columnExists {
			log.Println("Column application_id does not exist in containers table, skipping migration")
		} else {
			log.Printf("Warning: Could not alter application_id column: %v", err)
		}
	} else {
		log.Println("Successfully made application_id column nullable")
	}

	log.Println("Custom migrations completed")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
