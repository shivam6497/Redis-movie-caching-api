# Redis Cache API

A TypeScript REST API for managing movies with MongoDB for persistence and Redis for caching.

## Features

- Create movies in MongoDB
- Fetch all movies with Redis caching
- Fetch a movie by ID with cache lookup
- Clear the movie list cache when a new movie is created

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- Redis with ioredis
- dotenv for environment variables

## Project Structure

- `src/index.ts` - app entry point
- `src/config/db.ts` - MongoDB connection
- `src/redis/client.ts` - Redis client setup
- `src/models/movie.ts` - movie schema
- `src/controllers/movieController.ts` - route handlers
- `src/routes/movie.ts` - movie routes

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file

Use this example:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/redis-cache
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

### 3. Start MongoDB and Redis

Make sure both services are running locally, or update the env values to match your setup.

### 4. Run the app

Build and start the server:

```bash
npm run dev
```

If you want to build separately:

```bash
npm run build
npm run start
```

## API Endpoints

Base path: `/api/movies`

### `GET /api/movies`

Returns all movies.

Response source can be either `cache` or `database`.

### `GET /api/movies/:id`

Returns a single movie by MongoDB ID.

### `POST /api/movies`

Creates a new movie.

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

## Cache Behavior

- `GET /api/movies` stores the full list in Redis under `all_movies`
- `GET /api/movies/:id` stores each movie under `movie_<id>`
- `POST /api/movies` clears the `all_movies` cache key

## Notes

- The project uses ES module imports in source files.
- The compiled output is written to `dist/`.
- If MongoDB or Redis is unavailable, startup or route requests may fail depending on the operation.
