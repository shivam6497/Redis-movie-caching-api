import { Queue } from "bullmq";
import { bullmqRedis }from "../config/redis.js";

const emailQueue = new Queue("email-jobs", {
  // Cast to any to avoid type mismatch between different ioredis instances
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


export async function addEmailJob( data: { userId: string, email: string, name: string }){
    const job = await emailQueue.add("welcome-email", data);
    console.log(`Email job added to the queue with ID: ${job.id}`);
    return job;
}

export async function addMovieReportJob(data: {userId: string, reportType: string}) {
    const job = await emailQueue.add("movie-report", data, {
        delay: 10000,
    });
    console.log(`Movie report job added to the queue with ID: ${job.id}`);
    return job;
}

export default emailQueue;