import { truncate } from "fs";
import mongoose, { Schema, Document } from "mongoose";

export interface IMovie extends Document {
  title: string;
  genre: string;
  rating: number;
  year: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>({
  title: { type: String, required: true, trim: true },
  genre: { type: String, required: true, lowercase: true, trim: true },
  rating: { type: Number, required: true, min: 0, max: 10 },
  year: { type: Number, required: true },
  description: { type: String, default: "" },
}, {
    timestamps: true,
});

export const Movie = mongoose.model<IMovie>("Movie", movieSchema);
