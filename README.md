# LumaWay Backend API

## Setup Database

This project requires PostgreSQL. Since Docker is not available in the current environment, please ensure you have a running Postgres instance.

1. Create a database `lumaway`.
2. Set `DATABASE_URL` environment variable or use the default: `postgresql://postgres:postgres@localhost:5432/lumaway`.
3. Run the schema script:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```

## Running the API

```bash
npm install
npm run dev
```

The server runs on `http://localhost:3001`.
