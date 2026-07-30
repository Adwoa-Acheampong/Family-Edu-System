import { D1Database } from "@cloudflare/workers-types";

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

export async function getAssignments(userId: string, db: D1Database): Promise<Assignment[]> {
  const stmt = db.prepare("SELECT * FROM assignments WHERE user_id = ?");
  const result = await stmt.bind(userId).all();
  return result.results as unknown as Assignment[];
}

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
  const stmt = db.prepare("SELECT * FROM oauth_sessions WHERE session_id = ?");
  const result = await stmt.bind(sessionId).first();
  return result;
}

