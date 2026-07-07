import redisClient from "../config/redis.js";

const TTL = {
    SINGLE_MOVIE: 60 * 60,
    MOVIE_LIST: 60 * 5,
} as const;

export const cacheKeys = {
    movie: (id: string) => `movie:${id}`,
    movieList: (page: number, limit: number) => `movie:list:${page}:${limit}`,
    movieListPrefix: () => `movie:list:*`,
} as const;

export async function getCachedMovie<T>(id: string): Promise<T | null> {
    try {
        const cachedData = await redisClient.get(cacheKeys.movie(id));
        if(!cachedData) {
            return null;
        }
        return JSON.parse(cachedData) as T;
    } catch (error) {
        console.error("Error retrieving cached movie: ", error);
        return null;
    }
}

export async function setCachedMovie<T>(id: string, data: T): Promise<void> {
    try {
        await redisClient.setex(cacheKeys.movie(id), TTL.SINGLE_MOVIE, JSON.stringify(data));
    } catch (error) {
        console.error("Error setting cached movie: ", error);
    }
}

export async function getCachedMovieList<T>(page: number, limit: number): Promise<T | null> {
    try {
        const cachedData = await redisClient.get(cacheKeys.movieList(page, limit));
        if(!cachedData) return null;
        return JSON.parse(cachedData) as T;
    } catch(error) {
        console.error("Error retrieving cached movie list: ", error);
        return null;
    }
}

export async function setCachedMovieList<T>(page: number, limit: number, data: T): Promise<void> {
    try {
        await redisClient.setex(cacheKeys.movieList(page, limit), TTL.MOVIE_LIST, JSON.stringify(data));
    } catch(error) {
        console.error("Error setting cached movie list: ", error);
    }
}

export async function invalidateMovie(id: string): Promise<void> {
    try {
        await redisClient.del(cacheKeys.movie(id));
        console.log(`Cache invalidated for movie with ID: ${id}`);
    } catch (error) {
        console.error("Error invalidating cached movie: ", error);
    }
}

export async function invalidateMovieList() : Promise<void> {
    try {
        const patterns = cacheKeys.movieListPrefix();
        const keysToDelete: string[] = [];

        let cursor = "0";

        do {
            const [newCursor, keys] = await redisClient.scan(cursor, "MATCH", patterns, "COUNT", 100);
            cursor = newCursor;
            if(keys.length > 0) {
                keysToDelete.push(...keys);
            }
        } while(cursor !== "0");

        if(keysToDelete.length === 0) {
            console.log("No cached movie lists found to invalidate.");  
            return;
        }

        await redisClient.del(...keysToDelete);
        console.log(`Cache invalidated for ${keysToDelete.length} movie list(s).`);
    } catch (error) {
        console.error("Error invalidating cached movie lists: ", error);
    }
}