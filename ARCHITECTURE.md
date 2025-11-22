# Docker Manager - Architecture Documentation

## System Overview

Docker Manager is a comprehensive container orchestration platform built with Go (backend) and React (frontend), designed to manage Docker containers across multiple nodes with advanced features similar to Dockploy.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Projects    │  │ Applications │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Nodes       │  │ Deployments  │  │  Templates   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Traefik (Reverse Proxy)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Go/Gin)                          │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                    API Layer                          │       │
│  │  • REST API Endpoints                                 │       │
│  │  • WebSocket Handlers                                 │       │
│  │  • JWT Authentication                                 │       │
│  └──────────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                  Service Layer                        │       │
│  │  • Business Logic                                     │       │
│  │  • Docker Operations                                  │       │
│  │  • Deployment Management                              │       │
│  └──────────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                Repository Layer                       │       │
│  │  • Data Access                                        │       │
│  │  • GORM ORM                                           │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐
        │  PostgreSQL  │ │  Redis   │ │Docker Daemon │
        │   Database   │ │  Cache   │ │   (Local)    │
        └──────────────┘ └──────────┘ └──────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │   Remote Docker Nodes    │
                              │  (SSH/TCP connections)   │
                              └──────────────────────────┘
```

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP router)
- **ORM**: GORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Docker SDK**: Docker Engine API
- **Authentication**: JWT

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand / Redux Toolkit
- **API Client**: Axios / React Query
- **WebSocket**: Socket.io-client
- **Terminal**: xterm.js
- **Charts**: Chart.js

### Infrastructure
- **Reverse Proxy**: Traefik
- **Container Runtime**: Docker Engine
- **Orchestration**: Docker Compose

## Core Components

### 1. Organization Hierarchy

```
Organization (Company/Team)
└── Teams (Sub-groups)
    └── Projects (Top-level containers)
        └── Folders (Organize applications)
            └── Applications (Docker apps)
                └── Containers (Running instances)
```

### 2. Multi-Node Architecture

The system supports managing multiple Docker hosts:

- **Default Node**: Local Docker daemon
- **Remote Nodes**: Connected via SSH or TCP
- **Node Discovery**: Automatic detection and registration
- **Context Switching**: Docker context management
- **Load Distribution**: Applications can be deployed to specific nodes

### 3. Application Types

1. **Single Container**: Simple Docker container
2. **Docker Compose**: Multi-container applications
3. **Template-based**: Pre-configured templates

### 4. Deployment Strategies

#### Rolling Deployment (Default)
- Zero-downtime updates
- Sequential container replacement
- Health checks between updates

#### Blue/Green Deployment
- Two identical environments
- Instant traffic switch
- Easy rollback

#### Canary Deployment
- Gradual traffic shift
- Monitor new version
- Progressive rollout

### 5. Database Schema

#### Core Tables
- **users**: User accounts
- **organizations**: Organizations/companies
- **teams**: Sub-groups within organizations
- **projects**: Top-level project containers
- **folders**: Application organization
- **applications**: Docker applications
- **containers**: Running container instances
- **nodes**: Docker host nodes
- **deployments**: Deployment history
- **environments**: Environment configurations (dev, staging, prod)
- **env_vars**: Environment variables

#### Supporting Tables
- **volumes**: Docker volumes
- **networks**: Docker networks
- **images**: Docker images with security scan results
- **registries**: Private registry configurations
- **webhooks**: Git webhook configurations
- **cronjobs**: Scheduled tasks
- **templates**: Application templates
- **notifications**: User notifications
- **activities**: Audit logs

### 6. Security Features

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Organization-level permissions
- Team-level permissions
- Resource-level permissions

#### Secrets Management
- Encrypted storage in database
- Docker secrets integration
- HashiCorp Vault support (optional)
- Environment variable encryption

#### Security Scanning
- Image vulnerability scanning (Trivy/Clair)
- Security profiles (AppArmor, Seccomp)
- Registry authentication
- SSL/TLS support

### 7. Monitoring & Observability

#### Real-time Metrics
- CPU usage
- Memory usage
- Network I/O
- Disk usage
- Container logs streaming

#### Health Checks
- Custom health check endpoints
- Automatic restart on failure
- Status monitoring
- Alerting system

### 8. Integration Points

#### Version Control Systems
- GitLab
- Bitbucket
- GitHub
- Gitea

#### Webhooks
- Push events
- Pull request events
- Tag events
- Custom events

#### Reverse Proxy
- Traefik integration
- Dynamic routing
- SSL certificate management
- Load balancing

#### Cloud Services
- Cloudflare Tunnels
- MinIO/S3 storage
- External monitoring services

## API Structure

### REST API Endpoints

```
/api/v1
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
├── /organizations
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /projects
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── ...
├── /applications
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── POST /:id/start
│   ├── POST /:id/stop
│   ├── POST /:id/deploy
│   └── POST /:id/rollback
├── /nodes
├── /deployments
├── /templates
└── /webhooks
```

### WebSocket Events

```
/ws
├── container.status
├── deployment.progress
├── logs.stream
├── metrics.update
└── notification.new
```

## Deployment Pipeline

1. **Trigger**: Git push or manual trigger
2. **Webhook**: Receive webhook from VCS
3. **Queue**: Add to deployment queue
4. **Build**: 
   - Clone repository
   - Build Docker image
   - Cache layers
   - Security scan (optional)
5. **Deploy**:
   - Choose strategy (rolling/blue-green/canary)
   - Update containers
   - Run health checks
   - Switch traffic
6. **Monitor**:
   - Track deployment status
   - Send notifications
   - Log activities
7. **Rollback** (if needed):
   - Restore previous version
   - Update routing

## Scalability Considerations

### Horizontal Scaling
- Backend can run multiple instances
- Load balancing via Traefik
- Shared state in Redis
- Database connection pooling

### Auto-scaling
- Container-level auto-scaling
- Metric-based scaling
- Min/max replica configuration
- Cool-down periods

### Performance Optimization
- Redis caching
- Database query optimization
- Connection pooling
- Lazy loading
- Pagination

## Development Workflow

1. **Local Development**:
   ```bash
   docker-compose up
   ```

2. **Backend Development**:
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

3. **Frontend Development**:
   ```bash
   cd frontend
   npm start
   ```

## Production Deployment

1. **Prerequisites**:
   - Docker 24.0+
   - PostgreSQL 15+
   - Redis
   - SSL certificates (optional)

2. **Configuration**:
   - Set environment variables
   - Configure database
   - Set up Traefik

3. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Future Enhancements

- Kubernetes support
- GitOps integration
- Advanced monitoring (Prometheus, Grafana)
- Multi-region deployment
- Disaster recovery
- Backup automation
- Cost optimization
- Resource quotas
- Network policies
- Service mesh integration
