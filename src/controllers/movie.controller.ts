import type { Request, Response } from "express";
import { Movie } from "../models/movie.model.js";
import {
    setCachedMovie,
    getCachedMovie,
    setCachedMovieList,
    getCachedMovieList,
    invalidateMovie,
    invalidateMovieList,
} from "../cache/movie.cache.js";


export const getMovie = async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50 , parseInt(req.query.limit as string) || 10);

    const cacheData = await getCachedMovieList(page, limit);
    if(cacheData) {
        res.status(200).json({
            source: "cache",
            data: cacheData,
        });
        return;
    }

    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
        Movie.find().skip(skip).limit(limit).lean(),
        Movie.countDocuments(),
    ]);

    const payLoad = {
        movies,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit)},
    }

    await setCachedMovieList(page, limit, payLoad);
    res.json({
        source: "database",
        data: payLoad,
    })
}

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const cacheData = await getCachedMovie(id); 

    if(cacheData) {
        res.status(200).json({
            source: "cache",
            data: cacheData,
        });
        return;
    }

    const movie = await Movie.findById(id).lean();
    if(!movie) {
        res.status(404).json({
            message: "Movie not found",
        });
        return;
    }

    await setCachedMovie(id, movie);
    res.status(200).json({
        source: "database",
        data: movie,
    });
}

export const createMovie = async (req: Request, res: Response): Promise<void> => {
    const { title, genre, rating, year, description } = req.body;

    const movie = await Movie.create({
        title,
        genre,
        rating,
        year,
        description,
    });

    await invalidateMovieList();

    res.status(201).json({
        success: true,
        movie,
    })
}

export const updateMovie = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    const updated = await Movie.findByIdAndUpdate(id, req.body, {new : true , runValidators: true}).lean();
    if(!updated) {
        res.status(404).json({
            message: "Movie not found",
        });
        return;
    }

    await Promise.all([
        invalidateMovie(id),
        invalidateMovieList(),
    ]);

    res.status(200).json({
        success: true,
        movie: updated,
    });
}

export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    const deleted = await Movie.findByIdAndDelete(id).lean();
    if(!deleted) {
        res.status(404).json({
            message: "Movie not found",
        });
        return;
    }
    await Promise.all([
        invalidateMovie(id),
        invalidateMovieList(),
    ]);

    res.status(200).json({
        success: true,
        message: "Movie deleted successfully",
    });
}