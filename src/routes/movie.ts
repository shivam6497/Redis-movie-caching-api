import express from "express";
import {
    getAllMovies,
    getMovieById,
    createMovie,
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/", getAllMovies);
router.get("/:id", getMovieById);
router.post("/", createMovie);

export default router;