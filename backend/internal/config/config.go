package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Database   DatabaseConfig
	Redis      RedisConfig
	App        AppConfig
	Docker     DockerConfig
	Traefik    TraefikConfig
	Storage    StorageConfig
	Cloudflare CloudflareConfig
	VCS        VCSConfig
	Security   SecurityConfig
	Monitoring MonitoringConfig
	SMTP       SMTPConfig
	CORS       CORSConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type AppConfig struct {
	Env               string
	Port              int
	Host              string
	JWTSecret         string
	JWTExpirationHrs  int
	FrontendURL       string
	WebhookSecret     string
	RateLimitEnabled  bool
	RateLimitRequests int
	RateLimitDuration int
	LogLevel          string
	LogFormat         string
}

type DockerConfig struct {
	Host       string
	APIVersion string
}

type TraefikConfig struct {
	Enabled bool
	APIURL  string
	Network string
}

type StorageConfig struct {
	Type        string
	Path        string
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string
}

type CloudflareConfig struct {
	Enabled   bool
	APIToken  string
	AccountID string
}

type VCSConfig struct {
	GitLab    GitLabConfig
	Bitbucket BitbucketConfig
	Gitea     GiteaConfig
}

type GitLabConfig struct {
	Enabled      bool
	URL          string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type BitbucketConfig struct {
	Enabled      bool
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type GiteaConfig struct {
	Enabled      bool
	URL          string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type SecurityConfig struct {
	TrivyEnabled   bool
	TrivyServerURL string
	VaultEnabled   bool
	VaultAddress   string
	VaultToken     string
	VaultPath      string
}

type MonitoringConfig struct {
	PrometheusEnabled bool
	PrometheusPort    int
}

type SMTPConfig struct {
	Enabled  bool
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowCredentials bool
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists (for local development)
	_ = godotenv.Load()

	fmt.Println("-------------------")
	fmt.Println(getEnv("POSTGRES_HOST", ""))
	fmt.Println("-------------------")

	config := &Config{
		Database: DatabaseConfig{
			/* Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnvAsInt("POSTGRES_PORT", 5432),
			User:     getEnv("POSTGRES_USER", "dockermgr"),
			Password: getEnv("POSTGRES_PASSWORD", ""),
			Database: getEnv("POSTGRES_DB", "dockermanager"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"), */
			Host:     getEnv("POSTGRES_HOST", "91.98.86.215"),
			Port:     getEnvAsInt("POSTGRES_PORT", 5432),
			User:     getEnv("POSTGRES_USER", "dockermgr"),
			Password: getEnv("POSTGRES_PASSWORD", "dockermgr_dev_pass"),
			Database: getEnv("POSTGRES_DB", "dockermanager"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		App: AppConfig{
			Env:               getEnv("APP_ENV", "development"),
			Port:              getEnvAsInt("APP_PORT", 8080),
			Host:              getEnv("APP_HOST", "0.0.0.0"),
			JWTSecret:         getEnv("JWT_SECRET", "change_me"),
			JWTExpirationHrs:  getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
			FrontendURL:       getEnv("FRONTEND_URL", "http://localhost:3000"),
			WebhookSecret:     getEnv("WEBHOOK_SECRET", "change_me"),
			RateLimitEnabled:  getEnvAsBool("RATE_LIMIT_ENABLED", true),
			RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
			RateLimitDuration: getEnvAsInt("RATE_LIMIT_DURATION", 60),
			LogLevel:          getEnv("LOG_LEVEL", "info"),
			LogFormat:         getEnv("LOG_FORMAT", "json"),
		},
		Docker: DockerConfig{
			Host:       getEnv("DOCKER_HOST", "unix:///var/run/docker.sock"),
			APIVersion: getEnv("DOCKER_API_VERSION", "1.43"),
		},
		Traefik: TraefikConfig{
			Enabled: getEnvAsBool("TRAEFIK_ENABLED", true),
			APIURL:  getEnv("TRAEFIK_API_URL", "http://localhost:8081"),
			Network: getEnv("TRAEFIK_NETWORK", "web"),
		},
		Storage: StorageConfig{
			Type:        getEnv("STORAGE_TYPE", "local"),
			Path:        getEnv("STORAGE_PATH", "/data/storage"),
			S3Endpoint:  getEnv("S3_ENDPOINT", ""),
			S3AccessKey: getEnv("S3_ACCESS_KEY", ""),
			S3SecretKey: getEnv("S3_SECRET_KEY", ""),
			S3Bucket:    getEnv("S3_BUCKET", ""),
		},
		Cloudflare: CloudflareConfig{
			Enabled:   getEnvAsBool("CLOUDFLARE_ENABLED", false),
			APIToken:  getEnv("CLOUDFLARE_API_TOKEN", ""),
			AccountID: getEnv("CLOUDFLARE_ACCOUNT_ID", ""),
		},
		VCS: VCSConfig{
			GitLab: GitLabConfig{
				Enabled:      getEnvAsBool("GITLAB_ENABLED", false),
				URL:          getEnv("GITLAB_URL", "https://gitlab.com"),
				ClientID:     getEnv("GITLAB_CLIENT_ID", ""),
				ClientSecret: getEnv("GITLAB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GITLAB_REDIRECT_URL", ""),
			},
			Bitbucket: BitbucketConfig{
				Enabled:      getEnvAsBool("BITBUCKET_ENABLED", false),
				ClientID:     getEnv("BITBUCKET_CLIENT_ID", ""),
				ClientSecret: getEnv("BITBUCKET_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("BITBUCKET_REDIRECT_URL", ""),
			},
			Gitea: GiteaConfig{
				Enabled:      getEnvAsBool("GITEA_ENABLED", false),
				URL:          getEnv("GITEA_URL", ""),
				ClientID:     getEnv("GITEA_CLIENT_ID", ""),
				ClientSecret: getEnv("GITEA_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GITEA_REDIRECT_URL", ""),
			},
		},
		Security: SecurityConfig{
			TrivyEnabled:   getEnvAsBool("TRIVY_ENABLED", false),
			TrivyServerURL: getEnv("TRIVY_SERVER_URL", ""),
			VaultEnabled:   getEnvAsBool("VAULT_ENABLED", false),
			VaultAddress:   getEnv("VAULT_ADDRESS", ""),
			VaultToken:     getEnv("VAULT_TOKEN", ""),
			VaultPath:      getEnv("VAULT_PATH", "secret/data/docker-manager"),
		},
		Monitoring: MonitoringConfig{
			PrometheusEnabled: getEnvAsBool("PROMETHEUS_ENABLED", false),
			PrometheusPort:    getEnvAsInt("PROMETHEUS_PORT", 9090),
		},
		SMTP: SMTPConfig{
			Enabled:  getEnvAsBool("SMTP_ENABLED", false),
			Host:     getEnv("SMTP_HOST", ""),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", ""),
		},
		CORS: CORSConfig{
			AllowedOrigins:   strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ","),
			AllowCredentials: getEnvAsBool("CORS_ALLOW_CREDENTIALS", true),
		},
	}

	// Validate required fields
	if config.App.JWTSecret == "change_me" && config.App.Env == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}

	if config.Database.Password == "" {
		return nil, fmt.Errorf("POSTGRES_PASSWORD must be set")
	}

	return config, nil
}

// GetDSN returns PostgreSQL connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Database,
		c.Database.SSLMode,
	)
}

// GetRedisAddr returns Redis connection address
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}
