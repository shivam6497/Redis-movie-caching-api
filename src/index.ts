import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import movieRoutes from "./routes/movie.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);

app.use(express.json());
app.use("/api/movies", movieRoutes);

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
};

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
