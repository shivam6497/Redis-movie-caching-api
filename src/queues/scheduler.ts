import emailQueue, { JobPriority } from "../queues/email.queue.js";

export async function setupSchedulerJobs() {
    
    const repeatableJobs = await emailQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await emailQueue.removeRepeatableByKey(job.key);
    }

    console.log(`[Scheduler] Cleared ${repeatableJobs.length} existing repeatable jobs`);

    // job-1 daily cleanup at midnight
    await emailQueue.add(
        "daily-cleanup",
        { task: "cleanup", description: "Remove expired sessions and blacklisted tokens" },
        {
            repeat: {
                pattern: "0 0 * * *",
            },
            priority: JobPriority.LOW,
        }
    )
    console.log("[Scheduler] Daily cleanup job scheduled — runs at midnight");

    // job-2 weekly report every Monday at 9 AM
    await emailQueue.add(
        "weekly-report",
        { task: "weekly-report", description: "Generate and send weekly report" },
        {
            repeat: {
                pattern: "0 9 * * 1",
            },
            priority: JobPriority.NORMAL,
        }
    )
    console.log("[Scheduler] Weekly report job scheduled — runs every Monday at 9 AM");

    // job-3 health check every 5 minutes
    await emailQueue.add(
        "health-check",
        { task: "health-check", description: "Check system health and send alerts if needed" },
        {
            repeat: {
                pattern: "*/5 * * * *",
            },
            priority: JobPriority.CRITICAL,
        }
    )
    console.log("[Scheduler] Health check job scheduled — runs every 5 minutes");
}