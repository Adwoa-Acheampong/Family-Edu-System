import { D1Database } from "@cloudflare/workers-types";

// ── Types ──

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  points: number;
  course_id: string;
}

export interface Module {
  id: string;
  user_id: string;
  title: string;
  description: string;
  objectives: string;
  resources: string;
  order_index: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  estimated_hours: number;
  created_at: string;
  completed_at: string | null;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  module_id: string | null;
  assignment_id: string | null;
  action: string;
  xp_earned: number;
  created_at: string;
}

// ── Assignments ──

export async function getAssignments(userId: string, db: D1Database): Promise<Assignment[]> {
  const result = await db.prepare("SELECT * FROM assignments WHERE user_id = ? ORDER BY due_date ASC").bind(userId).all();
  return result.results as unknown as Assignment[];
}

export async function updateAssignmentStatus(id: string, status: string, db: D1Database) {
  await db.prepare("UPDATE assignments SET status = ? WHERE id = ?").bind(status, id).run();
}

// ── Modules ──

export async function getModules(userId: string, db: D1Database): Promise<Module[]> {
  const result = await db.prepare("SELECT * FROM modules WHERE user_id = ? ORDER BY order_index ASC").bind(userId).all();
  return result.results as unknown as Module[];
}

export async function createModule(mod: Omit<Module, "created_at" | "completed_at">, db: D1Database) {
  await db.prepare(
    `INSERT INTO modules (id, user_id, title, description, objectives, resources, order_index, status, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    mod.id, mod.user_id, mod.title, mod.description || "",
    mod.objectives || "", mod.resources || "",
    mod.order_index, mod.status, mod.estimated_hours
  ).run();
}

export async function updateModuleStatus(id: string, status: string, db: D1Database) {
  const completedAt = status === "COMPLETED" ? new Date().toISOString() : null;
  await db.prepare("UPDATE modules SET status = ?, completed_at = ? WHERE id = ?").bind(status, completedAt, id).run();
}

// ── Progress / XP ──

export async function logProgress(entry: Omit<ProgressEntry, "created_at">, db: D1Database) {
  await db.prepare(
    `INSERT INTO progress (id, user_id, module_id, assignment_id, action, xp_earned)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(entry.id, entry.user_id, entry.module_id, entry.assignment_id, entry.action, entry.xp_earned).run();
}

export async function getAnalyticsData(userId: string, db: D1Database) {
  const assignments = await db.prepare("SELECT * FROM assignments WHERE user_id = ?").bind(userId).all();
  const modules = await db.prepare("SELECT * FROM modules WHERE user_id = ?").bind(userId).all();
  const progress = await db.prepare(
    "SELECT * FROM progress WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  ).bind(userId).all();

  const allAssignments = assignments.results as unknown as Assignment[];
  const allModules = modules.results as unknown as Module[];
  const allProgress = progress.results as unknown as ProgressEntry[];

  const completed = allAssignments.filter(a => a.status === "GRADED" || a.status === "SUBMITTED").length
    + allModules.filter(m => m.status === "COMPLETED").length;
  const pending = allAssignments.filter(a => a.status === "PENDING").length
    + allModules.filter(m => m.status !== "COMPLETED").length;
  const totalXp = allProgress.reduce((sum, p) => sum + (p.xp_earned || 0), 0);

  // Calculate XP by day (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const xpByDay = days.map(day => ({ day, xp: 0 }));
  for (const p of allProgress) {
    const d = new Date(p.created_at);
    const dayIndex = d.getDay();
    xpByDay[dayIndex].xp += p.xp_earned || 0;
  }

  // Calculate streak (consecutive days with progress)
  const uniqueDays = new Set(allProgress.map(p => p.created_at?.substring(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    if (uniqueDays.has(key)) { streak++; } else if (i > 0) { break; }
  }

  return {
    source: "d1-live",
    completedAssignments: completed,
    pendingAssignments: pending,
    xpLast7Days: totalXp,
    currentStreak: streak,
    xpByDay,
    bySubject: [
      { subject: "Modules", count: allModules.length },
      { subject: "Assignments", count: allAssignments.length },
      { subject: "Completed", count: completed }
    ],
    curriculumMilestones: allModules.slice(0, 3).map((m, i) => ({
      phase: i === 0 ? "NOW" : i === 1 ? "NEXT" : "LATER",
      title: m.title,
      description: m.status === "COMPLETED" ? "✅ Completed" : m.status === "IN_PROGRESS" ? "🔄 In progress" : "⏳ Not started"
    }))
  };
}

// ── OAuth ──

export async function saveOAuthToken(sessionId: string, token: any, db: D1Database) {
  await db.prepare(`INSERT INTO oauth_sessions (session_id, access_token, refresh_token, expires_at, email, name)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at = excluded.expires_at,
    email = excluded.email,
    name = excluded.name`).bind(
    sessionId,
    token.access_token,
    token.refresh_token ?? null,
    token.expires_at,
    token.email ?? null,
    token.name ?? null
  ).run();
}

export async function getOAuthToken(sessionId: string, db: D1Database) {
  const result = await db.prepare("SELECT * FROM oauth_sessions WHERE session_id = ?").bind(sessionId).first();
  return result;
}

// ── Google API helpers ──

export async function callGoogleAPI(endpoint: string, accessToken: string, method: string = "GET", body?: any) {
  const opts: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(endpoint, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Google API ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

export async function getDriveUsage(accessToken: string) {
  const data = await callGoogleAPI(
    "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
    accessToken
  ) as any;
  return {
    usedBytes: parseInt(data.storageQuota?.usage || "0"),
    totalBytes: parseInt(data.storageQuota?.limit || String(15 * 1024 ** 3))
  };
}

export async function listDriveFiles(accessToken: string) {
  const data = await callGoogleAPI(
    "https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc",
    accessToken
  ) as any;
  return data.files || [];
}

export async function listClassroomCourses(accessToken: string) {
  const data = await callGoogleAPI(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20",
    accessToken
  ) as any;
  return data.courses || [];
}

export async function listClassroomAssignments(courseId: string, accessToken: string) {
  const data = await callGoogleAPI(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=50`,
    accessToken
  ) as any;
  return data.courseWork || [];
}
