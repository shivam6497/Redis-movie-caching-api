import mongoose, { Schema, Document } from "mongoose";

interface IMovie extends Document {
    title: string;
    genre: string;
    rating: number;
    year: number;
    description: string;
}

const movieSchema: Schema = new Schema({
    title: {type: String, required: true},
    genre: {type: String, required: true},
    rating: {type: Number, required: true},
    year: {type: String, required: true},
    description: {type: String, required: true},
});

export default mongoose.model<IMovie>("Movie", movieSchema);