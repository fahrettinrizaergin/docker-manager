# Deployment Guide

This guide covers deploying Docker Manager in various environments.

## Table of Contents
- [Quick Start (Development)](#quick-start-development)
- [Production Deployment](#production-deployment)
- [Cloud Providers](#cloud-providers)
- [Security Considerations](#security-considerations)
- [Monitoring](#monitoring)
- [Backup & Restore](#backup--restore)

## Quick Start (Development)

### Prerequisites
- Docker 24.0+
- Docker Compose 2.20+
- At least 4GB RAM
- 20GB free disk space

### Steps

1. Clone the repository:
```bash
git clone https://github.com/fahrettinrizaergin/docker-manager.git
cd docker-manager
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your settings (at minimum, change passwords):
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_at_least_32_chars
```

4. Create Traefik network:
```bash
make docker-network
```

5. Start the application:
```bash
make start
```

6. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health: http://localhost:8080/health
- Traefik Dashboard: http://localhost:8081

## Production Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Docker 24.0+
- Docker Compose 2.20+
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)

### Environment Setup

1. Create a production `.env` file:
```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=dockermgr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=dockermanager

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_PASSWORD_HERE

# Application
APP_ENV=production
APP_PORT=8080
JWT_SECRET=STRONG_JWT_SECRET_AT_LEAST_32_CHARACTERS
FRONTEND_URL=https://yourdomain.com

# Domain Configuration
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=your-email@example.com

# Traefik Basic Auth (generate with: htpasswd -nb admin password)
TRAEFIK_AUTH=admin:$$apr1$$xyz...
```

2. Generate strong passwords:
```bash
# PostgreSQL password
openssl rand -base64 32

# Redis password
openssl rand -base64 32

# JWT Secret (at least 32 characters)
openssl rand -base64 48
```

3. Generate Traefik basic auth:
```bash
htpasswd -nb admin your_password
```

### Deployment

1. Create Docker network:
```bash
docker network create web
```

2. Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

4. Verify health:
```bash
curl https://api.yourdomain.com/health
```

### SSL/TLS Configuration

The production setup uses Traefik with Let's Encrypt for automatic SSL certificates.

Ensure:
- Port 80 and 443 are open
- DNS records are properly configured
- Email in `LETSENCRYPT_EMAIL` is valid

### Reverse Proxy Setup

If using external reverse proxy (nginx, Apache):

```nginx
# Nginx configuration example
upstream backend {
    server localhost:8080;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Cloud Providers

### AWS EC2

1. Launch EC2 instance (t3.medium or larger)
2. Configure security group:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
3. Install Docker and Docker Compose
4. Follow production deployment steps

### DigitalOcean Droplet

1. Create Droplet (2GB RAM minimum)
2. Choose Docker image or install manually
3. Configure firewall
4. Follow production deployment steps

### Google Cloud Platform

1. Create Compute Engine instance
2. Allow HTTP/HTTPS traffic
3. Install Docker and Docker Compose
4. Follow production deployment steps

## Security Considerations

### Firewall Configuration

```bash
# UFW (Ubuntu)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Docker Socket Security

Never expose Docker socket directly. If remote management needed:
- Use SSH tunneling
- Use Docker Context with SSH
- Enable Docker TLS

### Secret Management

1. Never commit secrets to Git
2. Use environment variables
3. Consider HashiCorp Vault for production
4. Rotate secrets regularly

### Database Security

```bash
# Restrict PostgreSQL access
docker-compose exec postgres psql -U dockermgr -c "ALTER USER dockermgr WITH PASSWORD 'new_password';"
```

### Regular Updates

```bash
# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# PostgreSQL
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping
```

### Log Management

```bash
# View logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Save logs
docker-compose logs > logs.txt
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Backup & Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U dockermgr dockermanager > backup_$(date +%Y%m%d).sql

# Or use make command
make backup-db
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres psql -U dockermgr dockermanager < backup.sql

# Or use make command
make restore-db FILE=backup.sql
```

### Full Backup

```bash
# Backup volumes
docker run --rm -v dockermanager_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data

# Backup application data
tar czf docker-manager-backup.tar.gz .env docker-compose.prod.yml
```

### Automated Backups

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/docker-manager && docker-compose exec postgres pg_dump -U dockermgr dockermanager > /backups/db_$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

Traefik handles load balancing automatically with multiple replicas.

### Database Replication

For production, consider PostgreSQL replication:
- Primary-Replica setup
- Read replicas for reporting
- Connection pooling with PgBouncer

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose ps
```

### Database connection issues
```bash
docker-compose exec postgres psql -U dockermgr -d dockermanager
```

### Permission issues
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Disk space
```bash
# Clean up unused Docker resources
docker system prune -a --volumes
```

## Maintenance

### Updates

```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend ./server migrate
```

### Log Rotation

Configure Docker log rotation in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/fahrettinrizaergin/docker-manager/issues
- Documentation: Check README.md and ARCHITECTURE.md
