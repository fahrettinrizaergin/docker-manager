# Testing the Container Creation Fix

This document explains how to test the fix for the database constraint violation error when creating containers.

## Problem

The following API call was failing:

```bash
curl 'http://91.98.86.215/api/v1/containers' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"project_id":"28451b38-eccb-4070-9692-57be2fa2c7d1","name":"gfb","slug":"bcvf","type":"container"}'
```

**Error:** 
```
ERROR: null value in column "application_id" of relation "containers" violates not-null constraint (SQLSTATE 23502)
```

## Solution

The fix adds a database migration that makes the `application_id` column nullable in the `containers` table.

## How to Deploy the Fix

### Option 1: Automatic Migration (Recommended)

The migration runs automatically when you restart the application:

1. Deploy the updated code to your server
2. Restart the Docker Manager backend service
3. The migration will run automatically during startup
4. Check the logs for confirmation:
   ```
   Running custom migrations...
   Successfully made application_id column nullable
   Custom migrations completed
   ```

### Option 2: Manual Migration

If you prefer to run the migration manually before deploying:

1. Connect to your PostgreSQL database:
   ```bash
   psql -U dockermgr -d dockermanager
   ```

2. Run the migration:
   ```sql
   ALTER TABLE containers ALTER COLUMN application_id DROP NOT NULL;
   ```

3. Verify the change:
   ```sql
   SELECT column_name, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'containers' 
   AND column_name = 'application_id';
   ```
   
   Expected output:
   ```
    column_name    | is_nullable
   ----------------+-------------
    application_id | YES
   ```

## Testing the Fix

After deploying the fix, test container creation:

### 1. Get an Authentication Token

```bash
curl 'http://91.98.86.215/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@admin.com","password":"admin123!"}'
```

Save the token from the response.

### 2. Create a Container

```bash
curl 'http://91.98.86.215/api/v1/containers' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "project_id":"<YOUR_PROJECT_ID>",
    "name":"test-container",
    "slug":"test-container",
    "type":"container"
  }'
```

### 3. Expected Result

You should receive a successful response (HTTP 201) with the created container details:

```json
{
  "id": "...",
  "project_id": "...",
  "name": "test-container",
  "slug": "test-container",
  "type": "container",
  "status": "stopped",
  ...
}
```

## Verification

### Check Migration Status

To verify the migration ran successfully, check the application logs:

```bash
# If running with Docker Compose
docker-compose logs backend | grep "custom migrations"

# Expected output:
# Running custom migrations...
# Successfully made application_id column nullable
# Custom migrations completed
```

### Check Database Schema

Connect to the database and verify the column constraint:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'containers'
AND column_name = 'application_id';
```

The `is_nullable` column should show `YES`.

### Test Container Creation

Create a test container through the API and verify it succeeds without errors.

## Rollback (if needed)

If you need to rollback the migration (not recommended):

```sql
-- Make the column NOT NULL again (only if you add application_id support back)
ALTER TABLE containers ALTER COLUMN application_id SET NOT NULL;
```

**Warning:** This will fail if there are any NULL values in the `application_id` column.

## Troubleshooting

### Migration Doesn't Run

If the migration doesn't seem to run:

1. Check if the column already exists and is nullable:
   ```sql
   \d containers
   ```

2. Manually run the SQL migration file:
   ```bash
   psql -U dockermgr -d dockermanager -f backend/scripts/fix_application_id.sql
   ```

### Container Creation Still Fails

If container creation still fails after the migration:

1. Verify the migration ran by checking the logs
2. Check the database schema to ensure `application_id` is nullable
3. Try creating a container directly in the database to isolate the issue:
   ```sql
   INSERT INTO containers (id, project_id, name, slug, type, status, created_at, updated_at)
   VALUES (gen_random_uuid(), '<project_id>', 'test', 'test', 'container', 'stopped', NOW(), NOW());
   ```

### Get Help

If you continue to experience issues:

1. Check the application logs: `docker-compose logs backend`
2. Check the database logs: `docker-compose logs postgres`
3. Verify your database connection and credentials
4. Ensure the database user has ALTER TABLE permissions

## Additional Notes

- The `application_id` field is a legacy column that's no longer used in the current application model
- Making it nullable allows backward compatibility with older schemas
- Future versions may remove this column entirely (see commented line in `fix_application_id.sql`)
- The migration is idempotent and safe to run multiple times
