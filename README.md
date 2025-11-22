# Docker Manager

A comprehensive Docker management platform similar to Dockploy with advanced features for container orchestration, multi-node support, and team collaboration.

## Features

### Core Capabilities
- 🐳 Docker Compose support for applications and services
- 🌐 Multi-node deployment support
- 🔄 Traefik reverse proxy integration
- 👥 Advanced user and organization management
- 🔗 VCS integrations (GitLab, Bitbucket, Gitea)
- 💻 Container terminal access
- 📊 Resource monitoring (CPU, RAM, disk, network)
- 🔄 Rollback & deployment queue management
- 📦 Volume and environment management
- ☁️ Cloudflare Tunnels integration
- ⏰ Scheduled tasks (cron-like)
- 📝 Open source template system
- 🏢 Team/organization-based access control
- 📁 Project > Folder > Container organization hierarchy
- 🔔 Alert and notification system
- 🔍 Preview deployment support
- 🔐 Shared environment variables

### Advanced Docker Features
- ✅ Zero-downtime deployments (Blue/Green, Canary)
- 📈 Auto-scaling based on load
- ❤️ Custom health checks
- 🔒 Private registry support (Harbor, GitLab Registry)
- 🔑 Secrets management (Docker secrets, HashiCorp Vault)
- ⚡ Build caching & layer reuse
- 🔀 Dynamic reverse proxy configuration
- 🛡️ Image vulnerability scanning (Trivy, Clair)
- 🎯 Immutable deployments
- 🔧 Portainer integration (optional)
- 💾 Dynamic volume provisioning
- 🪝 Container lifecycle hooks
- 🔐 Security profiles (AppArmor, Seccomp)
- 🏷️ Image tag locking
- 🧩 Sidecar containers for logging, metrics, backup
- 🌍 Docker context switching for multi-host
- 📊 Live resource quota management UI
- 🐛 Ephemeral containers for debugging

## Tech Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP routing)
- **Database**: PostgreSQL 15+
- **ORM**: GORM
- **Authentication**: JWT tokens
- **Docker SDK**: Docker Engine API
- **Message Queue**: Redis (for background jobs)

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) / Ant Design
- **State Management**: Redux Toolkit / Zustand
- **API Client**: Axios / React Query
- **WebSocket**: Socket.io-client (for real-time updates)
- **Terminal**: xterm.js (for container terminal)
- **Charts**: Recharts / Chart.js (for monitoring)

### Infrastructure
- **Reverse Proxy**: Traefik
- **Container Runtime**: Docker Engine
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **File Storage**: MinIO / S3-compatible

## Project Structure

```
docker-manager/
├── backend/                    # Go backend
│   ├── cmd/
│   │   └── server/            # Main application entry point
│   ├── internal/
│   │   ├── api/               # HTTP handlers
│   │   ├── auth/              # Authentication logic
│   │   ├── config/            # Configuration
│   │   ├── database/          # Database models and migrations
│   │   ├── docker/            # Docker client wrapper
│   │   ├── middleware/        # HTTP middleware
│   │   ├── models/            # Domain models
│   │   ├── repository/        # Data access layer
│   │   ├── service/           # Business logic
│   │   └── websocket/         # WebSocket handlers
│   ├── pkg/                   # Public packages
│   ├── scripts/               # Utility scripts
│   ├── migrations/            # Database migrations
│   └── go.mod
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
└── README.md
```

## Getting Started

### Prerequisites
- Docker 24.0+
- Docker Compose 2.20+
- Go 1.21+ (for local development)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (or use Docker)

### Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone https://github.com/fahrettinrizaergin/docker-manager.git
cd docker-manager
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the application:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Traefik Dashboard: http://localhost:8081

### Local Development

#### Backend
```bash
cd backend
go mod download
go run cmd/server/main.go
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## Configuration

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=dockermgr
POSTGRES_PASSWORD=your_password
POSTGRES_DB=dockermanager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
APP_ENV=development
APP_PORT=8080
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Traefik
TRAEFIK_API_URL=http://traefik:8080

# Optional: Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=

# Optional: VCS Integrations
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
BITBUCKET_CLIENT_ID=
BITBUCKET_CLIENT_SECRET=
```

## API Documentation

Once running, API documentation is available at:
- Swagger UI: http://localhost:8080/swagger/index.html

## Architecture

### Multi-Node Support
The system supports managing multiple Docker hosts through:
- Docker Context switching
- Remote Docker API connections
- SSH tunneling to remote hosts

### Organization Hierarchy
```
Organization
└── Teams
    └── Projects
        └── Folders
            └── Containers/Applications
```

### Deployment Pipeline
1. Code push to VCS
2. Webhook triggers build
3. Image built with caching
4. Security scan (optional)
5. Blue/Green or Canary deployment
6. Health checks
7. Traffic switch
8. Rollback on failure

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Organization and team-level permissions
- Docker secrets integration
- HashiCorp Vault support
- AppArmor and Seccomp profiles
- Image vulnerability scanning
- Secure credential storage

## Monitoring

- Real-time resource usage (CPU, RAM, disk, network)
- Container logs streaming
- Health check status
- Deployment history
- Alert notifications

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [github.com/fahrettinrizaergin/docker-manager/issues](https://github.com/fahrettinrizaergin/docker-manager/issues)
