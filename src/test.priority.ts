import emailQueue, {
  addEmailJob,
  addPasswordResetJob,
  addMovieReportJob,
  JobPriority,
} from "./queues/email.queue.js";

async function testPriorities() {
  console.log("Pausing queue so all jobs load before worker touches them...\n");
  await emailQueue.pause();

  console.log("Adding jobs in this order: LOW, NORMAL, CRITICAL, HIGH");

  await addMovieReportJob({
    userId: "user-1",
    reportType: "monthly",
  });

  await addEmailJob(
    { userId: "user-2", email: "regular@test.com", name: "Regular User" },
    JobPriority.NORMAL
  );

  await addPasswordResetJob({
    userId: "user-3",
    email: "locked@test.com",
    name: "Locked User",
    resetToken: "reset-token-abc123",
  });

  await addEmailJob(
    { userId: "user-4", email: "premium@test.com", name: "Premium User" },
    JobPriority.HIGH
  );

  console.log("\nAll jobs added. Resuming queue now...\n");
  await emailQueue.resume();

  // give worker time to finish then exit
  await new Promise((resolve) => setTimeout(resolve, 15000));
  process.exit(0);
}

testPriorities();