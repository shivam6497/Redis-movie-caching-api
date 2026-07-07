import express from "express";
import {
    getMovie, getMovieById, createMovie, updateMovie, deleteMovie
} from "../controllers/movie.controller.js";

const router = express.Router();

router.get("/", getMovie);
router.get("/:id", getMovieById);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

export default router;