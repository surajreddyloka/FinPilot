#!/bin/bash
set -e

# Wait for the database to be ready before running migrations
echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until python -c "
import os, psycopg2, sys
db_url = os.environ.get('DATABASE_URL', '')
db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
db_url = db_url.replace('postgres://', 'postgresql://')
try:
    conn = psycopg2.connect(db_url)
    conn.close()
    print('Database is ready!')
    sys.exit(0)
except Exception as e:
    print(f'Database not ready: {e}')
    sys.exit(1)
" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "Database did not become ready in time. Exiting."
        exit 1
    fi
    echo "Retrying in 2 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "Running Alembic migrations..."
python -m alembic upgrade head

echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
