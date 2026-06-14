CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up basic schema permissions
GRANT ALL PRIVILEGES ON DATABASE finpilot TO postgres;
