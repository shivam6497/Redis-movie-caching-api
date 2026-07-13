import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import movieRoutes from "./routes/movie.routes.js";
import emailQueue, { addEmailJob as addWelcomeEmailJob, addMovieReportJob } from "./queues/email.queue.js";
import "./workers/email.worker.js";
import authRoutes from "./routes/auth.routes.js";
import { setupSchedulerJobs } from "./queues/scheduler.js";
import { addUserOnboardingFlow, addWeeklyReportFlow } from "./queues/flow.producer.js";
import { setupSubscribers } from "./pubsub/subscriber.js";
import { publishUrlCreated, publishUrlClicked, publishUrlLimitReached } from "./pubsub/publisher.js";
import { publishOrder } from "./streams/producer.js";
import { v4 as uuidv4 } from "uuid";

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

app.post("/order", async (req, res) => {
  const { userId, item, quantity } = req.body;
  
  const id = await publishOrder({
    orderId: uuidv4(),
    userId,
    item,
    quantity,
  });

  return res.json({ success: true, streamId: id });
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

app.post("/test/onboarding-flow", async (req, res) => {
  const { userId, email, name } = req.body;
  await addUserOnboardingFlow({ userId, email, name });
  res.json({ message: "Onboarding flow started" });
});

app.post("/test/weekly-report-flow", async (req, res) => {
  const reportId = `report-${Date.now()}`;
  await addWeeklyReportFlow({ reportId });
  res.json({ message: "Weekly report flow started", reportId });
});

app.post("/test/publish/url-created", async (req, res) => {
  const { userId, shortCode, originalUrl } = req.body;
  await publishUrlCreated({ userId, shortCode, originalUrl });
  res.json({ message: "url:created event published" });
});

app.post("/test/publish/url-clicked", async (req, res) => {
  const { shortCode } = req.body;
  await publishUrlClicked({
    shortCode,
    ip: req.ip ?? "unknown",
    userAgent: req.headers["user-agent"] ?? "unknown",
    timestamp: Date.now(),
  });
  res.json({ message: "url:clicked event published" });
});

app.post("/test/publish/url-limit-reached", async (req, res) => {
  const { userId, currentCount, limit } = req.body;
  await publishUrlLimitReached({ userId, currentCount, limit });
  res.json({ message: "url:limit:reached event published" });
});

async function start() {
  await connectDB();
  await setupSchedulerJobs();
  await setupSubscribers(); 
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
