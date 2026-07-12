import { FlowProducer } from "bullmq";
import { bullmqRedis } from "../config/redis.js";
import { JobPriority } from "./email.queue.js";

const flowProducer = new FlowProducer({
  connection: bullmqRedis as any,
});

export async function addUserOnboardingFlow(data: {
  userId: string;
  email: string;
  name: string;
}) {
  const flow = await flowProducer.add({
    name: "create-trial",
    queueName: "email-jobs",
    data: { userId: data.userId, plan: "free-trial", duration: 7 },
    opts: { priority: JobPriority.NORMAL },
    children: [
      {
        name: "onboarding-sms",
        queueName: "email-jobs",
        data: { userId: data.userId, phone: "placeholder", name: data.name },
        opts: { priority: JobPriority.HIGH },
        children: [
          {
            name: "welcome-email",
            queueName: "email-jobs",
            data: { userId: data.userId, email: data.email, name: data.name },
            opts: { priority: JobPriority.NORMAL },
          },
        ],
      },
    ],
  });
  console.log(
    `[Flow] User onboarding flow created | Root job ID: ${flow.job.id}`,
  );
  return flow;
}

export async function addWeeklyReportFlow(data: { reportId: string }) {
  const flow = await flowProducer.add({
    name: "weekly-report",
    queueName: "email-jobs",
    data: {
      reportId: data.reportId,
      description: "Generate and send weekly report",
    },
    opts: { priority: JobPriority.NORMAL },
    children: [
      {
        name: "fetch-user-data",
        queueName: "email-jobs",
        data: { reportId: data.reportId },
        opts: { priority: JobPriority.NORMAL },
      },
      {
        name: "fetch-movie-data",
        queueName: "email-jobs",
        data: { reportId: data.reportId },
        opts: { priority: JobPriority.NORMAL },
      },
      {
        name: "fetch-payment-data",
        queueName: "email-jobs",
        data: { reportId: data.reportId },
        opts: { priority: JobPriority.NORMAL },
      },
    ],
  });
  console.log(
    `[Flow] Weekly report flow created | Root job ID: ${flow.job.id}`,
  );
  return flow;
}

export default flowProducer;
