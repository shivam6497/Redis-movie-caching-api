import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const mongoUrl = process.env.MONGODB_URL;
    
  try {
    await mongoose.connect(mongoUrl as unknown as string);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB : ", error);
    throw error;
  }
};

export default connectDB;
