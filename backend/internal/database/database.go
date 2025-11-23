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
