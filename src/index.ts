import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import movieRoutes from "./routes/movie.routes.js";
import emailQueue, { addEmailJob as addWelcomeEmailJob, addMovieReportJob } from "./queues/email.queue.js";
import "./workers/email.worker.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);


app.use(express.json());
app.use("/movies", movieRoutes);
app.use("/auth", authRoutes);

app.post("/test/welcome-email", async (req, res) => { 
  const { userId, email, name } = req.body;
  await addWelcomeEmailJob({ userId, email, name });
  res.json({ message: "Welcome email job queued" });
});

app.post("/test/movie-report", async (req, res) => {
  const { userId, reportType } = req.body;
  await addMovieReportJob({ userId, reportType });
  res.json({ message: "Movie report job queued (runs in 10 seconds)" });
});

app.post("/test/failing-job", async (req, res) => {
  const job = await emailQueue.add("welcome-email", {
    userId: "fail_test",
    email: "fail@test.com",
    name: "Fail Test",
    shouldFail: true, 
  });
  res.json({ message: "Failing job queued", jobId: job.id });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
