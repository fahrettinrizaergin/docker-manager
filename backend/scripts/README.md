# Database Scripts

This directory contains SQL scripts for database management.

## Migration Scripts

### fix_application_id.sql

**Purpose**: Fixes the `application_id` column constraint in the `containers` table.

**Problem**: The database schema contains a legacy `application_id` column with a NOT NULL constraint, but the application model no longer uses this field. This causes errors when creating new containers:
```
ERROR: null value in column "application_id" of relation "containers" violates not-null constraint
```

**Solution**: The migration makes the `application_id` column nullable to allow container creation without this field.

**Automatic Execution**: This migration is automatically executed by the application when it starts up (see `backend/internal/database/database.go` -> `runCustomMigrations()`).

**Manual Execution**: If you need to run this migration manually:
```bash
psql -U <username> -d <database> -f fix_application_id.sql
```

**Alternative**: If the `application_id` column is no longer needed at all, you can uncomment the DROP COLUMN line in the SQL file to remove it entirely.

## Seed Data

### seed.sql

Contains sample template data for popular applications like PostgreSQL, Redis, and MySQL. This is useful for demo and testing purposes.
