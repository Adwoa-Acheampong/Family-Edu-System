import type { Express } from "express";
import { getEvents, getSettings, pushEvent, saveSettings } from "./server-store";

export function pushSystemEvent(event: string, status: string = "INFO") {
  pushEvent(event, status);
}

export function registerSystemRoutes(
  app: Express,
  mockAssignments: Record<string, { status: string; points?: number; title?: string; description?: string }[]>
) {
  app.get("/api/system/status", (_req, res) => {
    const started = Date.now();
    const latencyMs = Date.now() - started;
    const events = getEvents(12);
    res.json({
      apiStatus: "ok",
      latencyMs,
      time: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      recentEvents: events.length
        ? events
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
      xp: Math.max(0, Math.round(xp / 7) + ((userId.charCodeAt(0) + i * 17) % 80) || 20),
    }));

    res.json({
      source: "node-api",
      completedAssignments: completed,
      pendingAssignments: pending,
      xpLast7Days: xpByDay.reduce((s, d) => s + d.xp, 0),
      currentStreak: pending > 0 ? 3 : 5,
      xpByDay,
      bySubject: [
        { subject: "Core", count: Math.max(1, completed + pending) },
        { subject: "Practice", count: Math.max(0, pending) },
        { subject: "Review", count: Math.max(0, completed) },
      ],
      curriculumMilestones: [
        {
          phase: "NOW",
          title: list[0]?.title || "Active learning block",
          description: list[0]?.description || "Derived from current assignment queue",
        },
        {
          phase: "NEXT",
          title: list[1]?.title || "Upcoming focus",
          description: list[1]?.description || "Next item in the queue",
        },
      ],
    });
  });

  app.get("/api/system/settings", (_req, res) => {
    res.json(getSettings());
  });

  app.put("/api/system/settings", (req, res) => {
    const body = req.body || {};
    const next = saveSettings({
      pollIntervalMs: body.pollIntervalMs,
      engineRoomUrl: body.engineRoomUrl,
      classroomCourseId: body.classroomCourseId,
      enableNotifications: body.enableNotifications,
    });
    pushEvent("System settings updated", "SUCCESS");
    res.json({ ok: true, settings: next });
  });

  pushEvent("System routes registered", "SUCCESS");
}
