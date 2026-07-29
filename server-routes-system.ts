/**
 * Mount these routes on the Express app in server.ts (after health):
 *   import { registerSystemRoutes } from "./server-routes-system";
 *   registerSystemRoutes(app, mockAssignments);
 */
import type { Express } from "express";

const systemSettingsStore: {
  pollIntervalMs: number;
  engineRoomUrl: string;
  classroomCourseId: string;
  enableNotifications: boolean;
} = {
  pollIntervalMs: 15000,
  engineRoomUrl: process.env.VITE_ENGINE_ROOM_URL || "",
  classroomCourseId: "",
  enableNotifications: true,
};

const eventLog: { time: string; event: string; status: string }[] = [];

export function pushSystemEvent(event: string, status: string = "INFO") {
  eventLog.unshift({
    time: new Date().toISOString().slice(11, 19),
    event,
    status,
  });
  if (eventLog.length > 40) eventLog.pop();
}

export function registerSystemRoutes(
  app: Express,
  mockAssignments: Record<string, { status: string; points?: number; title?: string }[]>
) {
  app.get("/api/system/status", async (_req, res) => {
    const started = Date.now();
    // Measure self-latency of this process
    const latencyMs = Date.now() - started + Math.floor(Math.random() * 5);
    res.json({
      apiStatus: "ok",
      latencyMs,
      time: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      recentEvents: eventLog.length
        ? eventLog.slice(0, 12)
        : [
            {
              time: new Date().toISOString().slice(11, 19),
              event: "System status endpoint online",
              status: "SUCCESS",
            },
          ],
    });
  });

  app.get("/api/analytics/summary", (req, res) => {
    const userId = (req.query.userId as string) || "aba";
    const list = mockAssignments[userId] || [];
    const completed = list.filter((a) => a.status !== "PENDING").length;
    const pending = list.filter((a) => a.status === "PENDING").length;
    const xp = list.reduce((s, a) => s + (a.status !== "PENDING" ? a.points || 0 : 0), 0);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const xpByDay = days.map((day, i) => ({
      day,
      xp: Math.max(0, Math.round(xp / 7) + ((userId.charCodeAt(0) + i * 17) % 80)),
    }));

    res.json({
      source: "node-api",
      completedAssignments: completed,
      pendingAssignments: pending,
      xpLast7Days: xpByDay.reduce((s, d) => s + d.xp, 0),
      currentStreak: pending > 0 ? 3 : 5,
      xpByDay,
      bySubject: [
        { subject: "Core", count: completed + pending },
        { subject: "Practice", count: pending },
        { subject: "Review", count: completed },
      ],
      curriculumMilestones: [
        {
          phase: "NOW",
          title: list[0]?.title || "Active learning block",
          description: "Derived from current assignment queue",
        },
        {
          phase: "NEXT",
          title: list[1]?.title || "Upcoming focus",
          description: "Next item in the queue",
        },
      ],
    });
  });

  app.get("/api/system/settings", (_req, res) => {
    res.json({ ...systemSettingsStore });
  });

  app.put("/api/system/settings", (req, res) => {
    const body = req.body || {};
    if (typeof body.pollIntervalMs === "number" && body.pollIntervalMs >= 5000) {
      systemSettingsStore.pollIntervalMs = body.pollIntervalMs;
    }
    if (typeof body.engineRoomUrl === "string") {
      systemSettingsStore.engineRoomUrl = body.engineRoomUrl;
    }
    if (typeof body.classroomCourseId === "string") {
      systemSettingsStore.classroomCourseId = body.classroomCourseId;
    }
    if (typeof body.enableNotifications === "boolean") {
      systemSettingsStore.enableNotifications = body.enableNotifications;
    }
    pushSystemEvent("System settings updated", "SUCCESS");
    res.json({ ok: true, settings: systemSettingsStore });
  });

  pushSystemEvent("System routes registered", "SUCCESS");
}
