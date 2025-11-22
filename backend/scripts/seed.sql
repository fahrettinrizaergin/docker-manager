-- Sample seed data for Docker Manager
-- This script creates initial data for testing and demonstration

-- Insert sample templates
INSERT INTO templates (id, name, slug, description, category, icon, author, docker_compose, env_template, readme, is_official, is_public, version, created_at, updated_at)
VALUES 
    (
        gen_random_uuid(),
        'PostgreSQL',
        'postgresql',
        'PostgreSQL is a powerful, open source object-relational database system',
        'database',
        'postgresql.svg',
        'Docker Manager',
        'version: ''3.8''

services:
  postgres:
    image: postgres:15-alpine
    container_name: ${APP_NAME:-postgres}
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-database}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:',
        'POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=mydb
POSTGRES_PORT=5432
APP_NAME=my-postgres',
        '# PostgreSQL Template

PostgreSQL database with Alpine Linux.

## Features
- PostgreSQL 15
- Persistent storage
- Health checks
- Configurable credentials',
        true,
        true,
        '15.0',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Redis',
        'redis',
        'Redis is an open source in-memory data structure store',
        'database',
        'redis.svg',
        'Docker Manager',
        'version: ''3.8''

services:
  redis:
    image: redis:7-alpine
    container_name: ${APP_NAME:-redis}
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:',
        'REDIS_PASSWORD=change_me
REDIS_PORT=6379
APP_NAME=my-redis',
        '# Redis Template

In-memory data structure store.

## Features
- Redis 7 Alpine
- Password protected
- Persistent storage
- AOF enabled',
        true,
        true,
        '7.0',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'MySQL',
        'mysql',
        'MySQL is the worlds most popular open source database',
        'database',
        'mysql.svg',
        'Docker Manager',
        'version: ''3.8''

services:
  mysql:
    image: mysql:8
    container_name: ${APP_NAME:-mysql}
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:',
        'MYSQL_ROOT_PASSWORD=change_me
MYSQL_DATABASE=mydb
MYSQL_USER=myuser
MYSQL_PASSWORD=change_me
MYSQL_PORT=3306
APP_NAME=my-mysql',
        '# MySQL Template

Popular relational database.

## Features
- MySQL 8
- Persistent storage
- Custom database and user
- Configurable port',
        true,
        true,
        '8.0',
        NOW(),
        NOW()
    );

-- Note: Users, organizations, and other data should be created through the application
-- to ensure proper password hashing and validation
