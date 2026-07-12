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

async function handleDailyCleanup(job: Job) {
  const { description } = job.data;
  console.log(`[Worker] Running daily cleanup...`);
  console.log(`  → Task: ${description}`);

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`[Worker] Daily cleanup completed`);
  return { success: true, cleanedAt: new Date().toISOString() };
}

async function handleWeeklyReport(job: Job) {
  const { description } = job.data;
  console.log(`[Worker] Generating weekly report...`);
  console.log(`  → Task: ${description}`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`[Worker] Weekly report sent`);
  return { success: true, reportedAt: new Date().toISOString() };
}

async function handleHealthCheck(job: Job) {
  const { description } = job.data;
  console.log(`[Worker] Running health check...`);
  console.log(`  → Task: ${description}`);

  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log(`[Worker] Health check passed`);
  return { success: true, checkedAt: new Date().toISOString() };
}

async function handlePasswordReset(job: Job) {
  const { userId, email, name, resetToken } = job.data;

  console.log(`[Worker] Processing password reset...`);
  console.log(`  → User ID     : ${userId}`);
  console.log(`  → Email       : ${email}`);
  console.log(`  → Name        : ${name}`);
  console.log(`  → Reset Token : ${resetToken}`);

  await new Promise((resolve) => setTimeout(resolve, 500)); // faster than welcome email

  console.log(`[Worker] Password reset email sent to ${email}`);
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

async function handleOnboardingSMS(job: Job) {
  const { userId, name } = job.data;
  console.log(`[Worker] Sending onboarding SMS...`);
  console.log(`  → User ID : ${userId}`);
  console.log(`  → Name    : ${name}`);

  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log(`[Worker] Onboarding SMS sent to ${name}`);
  return { success: true, sentTo: userId };
}

async function handleCreateTrial(job: Job) {
  const { userId, plan, duration } = job.data;
  console.log(`[Worker] Creating trial account...`);
  console.log(`  → User ID  : ${userId}`);
  console.log(`  → Plan     : ${plan}`);
  console.log(`  → Duration : ${duration} days`);

  await new Promise((resolve) => setTimeout(resolve, 600));

  console.log(`[Worker] Trial created for user ${userId}`);
  return {
    success: true,
    trialEndsAt: new Date(Date.now() + duration * 86400000).toISOString(),
  };
}

async function handleFetchUserData(job: Job) {
  const { reportId, source } = job.data;
  console.log(
    `[Worker] Fetching user data for report ${reportId} from ${source}`,
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`[Worker] User data fetched`);
  return { success: true, records: 150 };
}

async function handleFetchMovieData(job: Job) {
  const { reportId, source } = job.data;
  console.log(
    `[Worker] Fetching movie data for report ${reportId} from ${source}`,
  );
  await new Promise((resolve) => setTimeout(resolve, 1200));
  console.log(`[Worker] Movie data fetched`);
  return { success: true, records: 340 };
}

async function handleFetchPaymentData(job: Job) {
  const { reportId, source } = job.data;
  console.log(
    `[Worker] Fetching payment data for report ${reportId} from ${source}`,
  );
  await new Promise((resolve) => setTimeout(resolve, 900));
  console.log(`[Worker] Payment data fetched`);
  return { success: true, records: 89 };
}

async function handleGenerateReport(job: Job) {
  const { reportId, description } = job.data;
  console.log(`[Worker] Generating combined report...`);
  console.log(`  → Report ID   : ${reportId}`);
  console.log(`  → Description : ${description}`);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`[Worker] Report ${reportId} generated successfully`);
  return { success: true, generatedAt: new Date().toISOString() };
}

const emailWorker = new Worker(
  "email-jobs",
  async (job: Job) => {
    switch (job.name) {
      case "welcome-email":
        return await handleWelcomeEmail(job);

      case "movie-report":
        return await handleMovieReport(job);

      case "password-reset":
        return await handlePasswordReset(job);

      case "daily-cleanup":
        return await handleDailyCleanup(job);

      case "weekly-report":
        return await handleWeeklyReport(job);

      case "health-check":
        return await handleHealthCheck(job);

      case "onboarding-sms":
        return await handleOnboardingSMS(job);

      case "create-trial":
        return await handleCreateTrial(job);

      case "fetch-user-data":
        return await handleFetchUserData(job);

      case "fetch-movie-data":
        return await handleFetchMovieData(job);

      case "fetch-payment-data":
        return await handleFetchPaymentData(job);

      case "generate-report":
        return await handleGenerateReport(job);

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: bullmqRedis as any,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(
    `[Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`,
  );
  console.error(`  → Attempts made: ${job?.attemptsMade}`);
});

emailWorker.on("active", (job) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) started processing`);
});

export default emailWorker;
