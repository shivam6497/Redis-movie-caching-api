import type { Request, Response } from "express";
import Movie from "../models/movie.js";
import redisClient from "../redis/client.js";

const CACHE_EXPIRY = 60;

// get all movies
export const getAllMovies = async (req: Request, res: Response) => {
    try {
        const cacheKey = "all_movies";

        const cachedData = await redisClient.get(cacheKey);

        if(cachedData) {
            console.log("CACHE HIT");
            res.json({
                success: true,
                source: "cache",
                data: JSON.parse(cachedData),
            });
            return;
        }

        console.log("CACHE MISS");
        const movies = await Movie.find();

        await redisClient.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(movies));

        res.json({
            success: true,
            source: "database",
            data: movies,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// get movie by id
export const getMovieById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const cacheKey = `movie_${id}`;
        
        const cachedData  = await redisClient.get(cacheKey);

        if(cachedData) {
            res.json({
                success: true,
                source: "cache",
                data: JSON.parse(cachedData),
            });
            return;
        }

        const movie = await Movie.findById(id);

        if(!movie) {
            res.status(404).json({
                success: false,
                message: "Movie not found",
            });
            return;
        }

        await redisClient.setex(cacheKey, CACHE_EXPIRY, JSON.stringify(movie));

        res.json({
            success: true,
            source: "database",
            data: movie,
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// create a new movie
export const createMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.create(req.body);

        await redisClient.del("all_movies");
        console.log("Cache cleared for all_movies");

        res.status(201).json({
            success: true,
            data: movie,
        });
    } catch(error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
