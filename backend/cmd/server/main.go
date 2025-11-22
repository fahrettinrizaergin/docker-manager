package main

import (
	"fmt"
	"log"

	"github.com/fahrettinrizaergin/docker-manager/internal/api"
	"github.com/fahrettinrizaergin/docker-manager/internal/config"
	"github.com/fahrettinrizaergin/docker-manager/internal/database"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	if err := database.Initialize(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Get database instance
	db := database.GetDB()

	// Setup router
	router := api.SetupRouter(cfg, db)

	// Start server
	addr := fmt.Sprintf("%s:%d", cfg.App.Host, cfg.App.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
