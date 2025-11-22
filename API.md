# Docker Manager API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "first_name": "John",
  "last_name": "Doe"
}
```

## Organizations

### List Organizations
```http
GET /organizations
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "name": "My Organization",
    "slug": "my-organization",
    "description": "Organization description",
    "owner_id": "uuid",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Organization
```http
POST /organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Organization",
  "slug": "new-organization",
  "description": "Description"
}
```

### Get Organization
```http
GET /organizations/:id
Authorization: Bearer <token>
```

### Update Organization
```http
PUT /organizations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Organization
```http
DELETE /organizations/:id
Authorization: Bearer <token>
```

## Projects

### List Projects
```http
GET /projects?organization_id=uuid
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "My Project",
    "slug": "my-project",
    "description": "Project description",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "uuid",
  "name": "New Project",
  "slug": "new-project",
  "description": "Description"
}
```

## Applications

### List Applications
```http
GET /applications?project_id=uuid
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "name": "My App",
    "slug": "my-app",
    "type": "docker-compose",
    "status": "running",
    "image": "nginx:latest",
    "domain": "app.example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Application
```http
POST /applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "uuid",
  "name": "New App",
  "slug": "new-app",
  "type": "docker-compose",
  "repository": "https://github.com/user/repo.git",
  "branch": "main",
  "compose_file": "docker-compose.yml",
  "domain": "app.example.com",
  "port": 80,
  "internal_port": 3000
}
```

### Get Application
```http
GET /applications/:id
Authorization: Bearer <token>
```

### Update Application
```http
PUT /applications/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "domain": "new-domain.example.com"
}
```

### Start Application
```http
POST /applications/:id/start
Authorization: Bearer <token>

Response:
{
  "message": "Application started successfully",
  "status": "running"
}
```

### Stop Application
```http
POST /applications/:id/stop
Authorization: Bearer <token>

Response:
{
  "message": "Application stopped successfully",
  "status": "stopped"
}
```

### Restart Application
```http
POST /applications/:id/restart
Authorization: Bearer <token>
```

### Deploy Application
```http
POST /applications/:id/deploy
Authorization: Bearer <token>
Content-Type: application/json

{
  "strategy": "rolling",
  "commit_sha": "abc123",
  "branch": "main"
}

Response:
{
  "deployment_id": "uuid",
  "status": "pending",
  "message": "Deployment queued"
}
```

### Rollback Application
```http
POST /applications/:id/rollback
Authorization: Bearer <token>
Content-Type: application/json

{
  "deployment_id": "uuid"
}
```

### Get Application Logs
```http
GET /applications/:id/logs?tail=100&follow=false
Authorization: Bearer <token>

Response:
{
  "logs": "Container log output..."
}
```

### Get Application Stats
```http
GET /applications/:id/stats
Authorization: Bearer <token>

Response:
{
  "cpu_usage": 45.5,
  "memory_usage": 512000000,
  "memory_limit": 1024000000,
  "network_rx": 1024000,
  "network_tx": 2048000
}
```

## Environment Variables

### List Environment Variables
```http
GET /applications/:id/env
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "key": "DATABASE_URL",
    "value": "postgresql://...",
    "is_secret": true,
    "is_shared": false
  }
]
```

### Create Environment Variable
```http
POST /applications/:id/env
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "API_KEY",
  "value": "secret-value",
  "is_secret": true
}
```

### Update Environment Variable
```http
PUT /applications/:id/env/:envId
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "new-value"
}
```

### Delete Environment Variable
```http
DELETE /applications/:id/env/:envId
Authorization: Bearer <token>
```

## Nodes

### List Nodes
```http
GET /nodes?organization_id=uuid
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Main Node",
    "host": "unix:///var/run/docker.sock",
    "status": "online",
    "docker_version": "24.0.7",
    "cpus": 8,
    "memory": 16000000000
  }
]
```

### Create Node
```http
POST /nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "uuid",
  "name": "Remote Node",
  "host": "tcp://remote-host:2375",
  "use_ssh": true,
  "ssh_user": "docker",
  "ssh_key": "-----BEGIN RSA PRIVATE KEY-----..."
}
```

### Test Node Connection
```http
POST /nodes/:id/test
Authorization: Bearer <token>

Response:
{
  "status": "online",
  "docker_version": "24.0.7",
  "message": "Connection successful"
}
```

### Get Node Stats
```http
GET /nodes/:id/stats
Authorization: Bearer <token>

Response:
{
  "cpu_usage": 35.5,
  "memory_usage": 8000000000,
  "memory_total": 16000000000,
  "disk_usage": 50000000000,
  "disk_total": 100000000000,
  "containers_running": 12,
  "containers_total": 15
}
```

## Deployments

### List Deployments
```http
GET /deployments?application_id=uuid
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "application_id": "uuid",
    "status": "success",
    "version": "v1.0.0",
    "commit_sha": "abc123",
    "branch": "main",
    "strategy": "rolling",
    "created_at": "2024-01-01T00:00:00Z",
    "deploy_duration": 120
  }
]
```

### Get Deployment
```http
GET /deployments/:id
Authorization: Bearer <token>
```

### Cancel Deployment
```http
POST /deployments/:id/cancel
Authorization: Bearer <token>

Response:
{
  "message": "Deployment cancelled",
  "status": "cancelled"
}
```

### Get Deployment Logs
```http
GET /deployments/:id/logs
Authorization: Bearer <token>

Response:
{
  "build_logs": "Building image...",
  "deploy_logs": "Deploying containers..."
}
```

## Templates

### List Templates
```http
GET /templates?category=database
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "name": "PostgreSQL",
    "slug": "postgresql",
    "description": "PostgreSQL database",
    "category": "database",
    "icon": "postgresql.svg",
    "is_official": true,
    "version": "15.0"
  }
]
```

### Get Template
```http
GET /templates/:id
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "name": "PostgreSQL",
  "docker_compose": "version: '3.8'...",
  "env_template": "POSTGRES_PASSWORD=...",
  "readme": "# PostgreSQL Template..."
}
```

### Deploy Template
```http
POST /templates/:id/deploy
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "uuid",
  "name": "My PostgreSQL",
  "env_vars": {
    "POSTGRES_PASSWORD": "secure-password"
  }
}
```

## Webhooks

### Create Webhook
```http
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "application_id": "uuid",
  "name": "Deploy on Push",
  "type": "gitlab",
  "events": ["push"],
  "auto_deploy": true,
  "branches": ["main", "develop"]
}

Response:
{
  "id": "uuid",
  "url": "https://api.example.com/api/v1/webhooks/receive/gitlab",
  "secret": "webhook-secret"
}
```

## Notifications

### List Notifications
```http
GET /notifications?unread=true
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "type": "deployment",
    "title": "Deployment Successful",
    "message": "Application deployed successfully",
    "level": "success",
    "is_read": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

## WebSocket Events

Connect to: `ws://localhost:8080/ws?token=<jwt-token>`

### Events

#### Container Status Update
```json
{
  "event": "container.status",
  "data": {
    "container_id": "uuid",
    "status": "running"
  }
}
```

#### Deployment Progress
```json
{
  "event": "deployment.progress",
  "data": {
    "deployment_id": "uuid",
    "status": "deploying",
    "progress": 75
  }
}
```

#### Log Stream
```json
{
  "event": "logs.stream",
  "data": {
    "container_id": "uuid",
    "log": "Application started on port 3000"
  }
}
```

#### Metrics Update
```json
{
  "event": "metrics.update",
  "data": {
    "container_id": "uuid",
    "cpu": 45.5,
    "memory": 512000000
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- Default: 100 requests per minute per IP
- Rate limit headers included in response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets
