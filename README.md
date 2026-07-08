# Redis Cache API

A TypeScript REST API that combines MongoDB, Redis caching, JWT authentication, and a BullMQ email queue. The app exposes movie CRUD endpoints, auth endpoints, cache-backed reads, and a small set of queue demo routes for testing background jobs.

## Features

- Movie CRUD with MongoDB and Redis cache invalidation
- Paginated movie listing with cache hits returned from Redis
- JWT auth with register, login, logout, and current-user lookup
- Redis-backed token blacklist for logout
- BullMQ queue for welcome-email and movie-report jobs
- Background worker that processes queued email jobs
- Health check endpoint for quick verification

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- Redis with ioredis
- BullMQ for background jobs
- JSON Web Tokens for auth
- bcryptjs for password hashing
- dotenv for environment variables

## Project Structure

- `src/index.ts` - application entry point and route registration
- `src/config/db.ts` - MongoDB connection
- `src/config/redis.ts` - Redis clients for caching, blacklist checks, and BullMQ
- `src/models/movie.model.ts` - movie schema
- `src/models/user.model.ts` - user schema and password hashing
- `src/controllers/movie.controller.ts` - movie CRUD logic
- `src/controllers/auth.controller.ts` - auth handlers
- `src/cache/movie.cache.ts` - Redis cache helpers for movie data
- `src/routes/movie.routes.ts` - movie routes
- `src/routes/auth.routes.ts` - auth routes
- `src/middleware/auth.middleware.ts` - JWT and blacklist protection
- `src/queues/email.queue.ts` - BullMQ queue setup and job helpers
- `src/workers/email.worker.ts` - background worker that processes email jobs

## Environment Variables

Create a `.env` file in the project root.

```env
MONGODB_URL=mongodb://127.0.0.1:27017/redis-cache
REDIS_HOST=127.0.0.1
JWT_SECRET=your-super-secret-key
PORT=3000
```

Notes:

- `MONGODB_URL` is required for database connection.
- `REDIS_HOST` must match the Redis connection target used by your local or remote setup.
- `JWT_SECRET` is required for signing and verifying auth tokens.
- `PORT` controls the HTTP server port.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Start MongoDB and Redis.

Make sure both services are available before starting the API.

3. Add the environment variables above to `.env`.

## Run

Build the TypeScript sources and start the compiled server.

```bash
npm run dev
```

You can also run the steps separately.

```bash
npm run build
npm start
```

## API Overview

The server registers these route groups:

- `/movies` - movie CRUD and cache-backed reads
- `/auth` - authentication and user session routes
- `/health` - health check
- `/test/*` - queue demo routes

### Health Check

`GET /health`

Returns server status and a timestamp.

### Movies

`GET /movies?page=1&limit=10`

Returns a paginated movie list. The response includes a `source` field with either `cache` or `database`.

`GET /movies/:id`

Returns a single movie by MongoDB ID. The response includes a `source` field with either `cache` or `database`.

`POST /movies`

Creates a movie.

Example body:

```json
{
  "title": "Inception",
  "genre": "Sci-Fi",
  "rating": 9,
  "year": 2010,
  "description": "A thief enters dreams to steal secrets."
}
```

`PUT /movies/:id`

Updates a movie and clears the relevant Redis cache entries.

`DELETE /movies/:id`

Deletes a movie and clears the relevant Redis cache entries.

### Auth

`POST /auth/register`

Registers a new user and returns a JWT.

Example body:

```json
{
  "name": "Shivam",
  "email": "shivam@example.com",
  "password": "secret123"
}
```

`POST /auth/login`

Authenticates a user and returns a JWT.

Example body:

```json
{
  "email": "shivam@example.com",
  "password": "secret123"
}
```

`POST /auth/logout`

Requires an `Authorization: Bearer <token>` header. The token is blacklisted in Redis.

`GET /auth/me`

Requires an `Authorization: Bearer <token>` header. Returns the current user without the password.

## Queue Demo Routes

These routes are useful for testing the BullMQ worker.

`POST /test/welcome-email`

Queues a welcome-email job.

Example body:

```json
{
  "userId": "123",
  "email": "user@example.com",
  "name": "User"
}
```

`POST /test/movie-report`

Queues a movie-report job that runs after a short delay.

Example body:

```json
{
  "userId": "123",
  "reportType": "weekly"
}
```

`POST /test/failing-job`

Queues a job that is designed to fail so you can verify retry and failure handling.

## Redis Cache Behavior

- Movie list responses are cached by page and limit.
- Single movie responses are cached by movie ID.
- Creating, updating, or deleting a movie invalidates the affected movie cache and the paginated list cache.
- Logout stores the current JWT in Redis as a blacklist entry.

## Background Worker

The worker in `src/workers/email.worker.ts` is loaded when the server starts. It handles two job types:

- `welcome-email`
- `movie-report`

The worker logs job progress, retries failed jobs according to the queue configuration, and removes completed or failed jobs after the configured limits.

## Notes

- The project uses ES module imports.
- The compiled output is written to `dist/`.
- `npm run dev` in this project compiles TypeScript and then starts the server; it is not a watch mode.
- If MongoDB, Redis, or `JWT_SECRET` is missing, startup or authenticated requests will fail.
