import { Queue } from "bullmq";
import { bullmqRedis } from "../config/redis.js";

export const JobPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
} as const;

const emailQueue = new Queue("email-jobs", {
  connection: bullmqRedis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

export async function addPasswordResetJob(data: {
  userId: string;
  email: string;
  name: string;
  resetToken: string;
}) {
  const job = await emailQueue.add("password-reset", data, {
    priority: JobPriority.CRITICAL,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });

  console.log(`Password reset job added | ID: ${job.id} | Priority: ${JobPriority.CRITICAL}`);
  return job;
}

export async function addEmailJob(
  data: { userId: string; email: string; name: string },
  priority: number = JobPriority.NORMAL,
) {
  const job = await emailQueue.add("welcome-email", data, { priority });
  console.log(`Email job added to the queue with ID: ${job.id}`);
  return job;
}

export async function addMovieReportJob(data: {
  userId: string;
  reportType: string;
}) {
  const job = await emailQueue.add("movie-report", data, {
    delay: 10000,
    priority: JobPriority.LOW,
  });
  console.log(
    `Movie report job added | ID: ${job.id} | Priority: ${JobPriority.LOW}`,
  );
  return job;
}

export default emailQueue;
