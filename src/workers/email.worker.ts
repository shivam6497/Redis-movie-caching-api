import { Worker, type Job } from "bullmq";
import { bullmqRedis } from "../config/redis.js";

async function handleWelcomeEmail(job: Job) {
  const { userId, email, name, shouldFail } = job.data;
  console.log(`[Worker] Processing welcome email...`); 

  if (shouldFail) {
    throw new Error("Email service is down!");
  }
  
  console.log(`  → User ID : ${userId}`);
  console.log(`  → Email   : ${email}`);
  console.log(`  → Name    : ${name}`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`[Worker]  Welcome email sent to ${email}`);
  return { success: true, sentTo: email };
}

async function handleMovieReport(job: Job) {
  const { userId, reportType } = job.data;

  console.log(`[Worker] Processing movie report...`);
  console.log(`  → User ID     : ${userId}`);
  console.log(`  → Report Type : ${reportType}`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`[Worker]  Movie report generated for user ${userId}`);
  return { success: true, reportType };
}

const emailWorker = new Worker(
    "email-jobs",
    async (job: Job) => {
        switch (job.name) {
            case "welcome-email":
            return await handleWelcomeEmail(job);

            case "movie-report":
            return await handleMovieReport(job);

            default: 
            throw new Error(`Unknown job type: ${job.name}`);
        }
    }, 
    {
        connection: bullmqRedis as any,
        concurrency: 5,
    }
);

emailWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
  console.error(`  → Attempts made: ${job?.attemptsMade}`);
});

emailWorker.on("active", (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) started processing`);
});

export default emailWorker;
