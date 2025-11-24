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

	// Check if the column exists first
	var columnExists bool
	err := DB.Raw(`
		SELECT EXISTS (
			SELECT 1 
			FROM information_schema.columns 
			WHERE table_name = 'containers' 
			AND column_name = 'application_id'
			AND table_schema = current_schema()
		)
	`).Scan(&columnExists).Error

	if err != nil {
		log.Printf("Error: Could not check if application_id column exists: %v", err)
		return fmt.Errorf("failed to check column existence: %w", err)
	}

	if !columnExists {
		log.Println("Column application_id does not exist in containers table, skipping migration")
	} else {
		// Column exists, attempt to make it nullable
		if err := DB.Exec("ALTER TABLE containers ALTER COLUMN application_id DROP NOT NULL").Error; err != nil {
			log.Printf("Error: Could not alter application_id column: %v", err)
			return fmt.Errorf("failed to alter application_id column: %w", err)
		}
		log.Println("Successfully made application_id column nullable")
	}

	// Fix node_id column constraint in containers table
	// This column should be nullable as per the model definition (*uuid.UUID)
	var nodeColumnExists bool
	err = DB.Raw(`
		SELECT EXISTS (
			SELECT 1 
			FROM information_schema.columns 
			WHERE table_name = 'containers' 
			AND column_name = 'node_id'
			AND table_schema = current_schema()
		)
	`).Scan(&nodeColumnExists).Error

	if err != nil {
		log.Printf("Error: Could not check if node_id column exists: %v", err)
		return fmt.Errorf("failed to check node_id column existence: %w", err)
	}

	if nodeColumnExists {
		// Column exists, attempt to make it nullable
		if err := DB.Exec("ALTER TABLE containers ALTER COLUMN node_id DROP NOT NULL").Error; err != nil {
			log.Printf("Error: Could not alter node_id column: %v", err)
			return fmt.Errorf("failed to alter node_id column: %w", err)
		}
		log.Println("Successfully made node_id column nullable")
	}

	// Fix container_id column constraint in containers table
	// This column might be a legacy field or created by mistake
	// Make it nullable to prevent NOT NULL constraint violations
	var containerColumnExists bool
	err = DB.Raw(`
		SELECT EXISTS (
			SELECT 1 
			FROM information_schema.columns 
			WHERE table_name = 'containers' 
			AND column_name = 'container_id'
			AND table_schema = current_schema()
		)
	`).Scan(&containerColumnExists).Error

	if err != nil {
		log.Printf("Error: Could not check if container_id column exists: %v", err)
		return fmt.Errorf("failed to check container_id column existence: %w", err)
	}

	if containerColumnExists {
		// Column exists, attempt to make it nullable
		if err := DB.Exec("ALTER TABLE containers ALTER COLUMN container_id DROP NOT NULL").Error; err != nil {
			log.Printf("Error: Could not alter container_id column: %v", err)
			return fmt.Errorf("failed to alter container_id column: %w", err)
		}
		log.Println("Successfully made container_id column nullable")
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
