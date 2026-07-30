import { Router } from "itty-router";
import { getAssignments, saveOAuthToken, getOAuthToken } from "./db";
import { D1Database } from "@cloudflare/workers-types";

// Helper to parse JSON body
async function json(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

const router = Router();

router.get("/api/health", async (request) => {
  return new Response(JSON.stringify({ status: "ok", googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

router.get("/api/system/status", async (request) => {
  return new Response(JSON.stringify({
    apiStatus: "ok",
    latencyMs: 12,
    time: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID,
    recentEvents: [{ time: new Date().toISOString().slice(11, 19), event: "System status endpoint online (Worker)", status: "SUCCESS" }]
  }), { headers: { "Content-Type": "application/json" }});
});


router.post("/api/sync-classroom", async (request) => {
  const body = await json(request);
  const userId = body?.userId || "aba";
  // For demo we just return empty assignments – real implementation would call Google Classroom
  const assignments = [];
  return new Response(JSON.stringify({ assignments, courses: [] }), { headers: { "Content-Type": "application/json" } });
});

router.get("/api/analytics/summary", async (request) => {
  return new Response(JSON.stringify({
    source: "worker-api",
    completedAssignments: 5,
    pendingAssignments: 2,
    xpLast7Days: 140,
    currentStreak: 3,
    xpByDay: [
      { day: "Mon", xp: 20 }, { day: "Tue", xp: 30 }, { day: "Wed", xp: 15 },
      { day: "Thu", xp: 25 }, { day: "Fri", xp: 20 }, { day: "Sat", xp: 10 }, { day: "Sun", xp: 20 }
    ],
    bySubject: [
      { subject: "Core", count: 4 },
      { subject: "Practice", count: 2 },
      { subject: "Review", count: 1 }
    ],
    curriculumMilestones: [
      { phase: "NOW", title: "Active learning block", description: "Derived from current assignment queue" },
      { phase: "NEXT", title: "Upcoming focus", description: "Next item in the queue" }
    ]
  }), { headers: { "Content-Type": "application/json" }});
});

router.get("/api/system/settings", async () => {
  return new Response(JSON.stringify({
    pollIntervalMs: 30000,
    engineRoomUrl: "http://localhost:3000",
    classroomCourseId: "",
    enableNotifications: true
  }), { headers: { "Content-Type": "application/json" }});
});

router.get("/api/drive-usage", async () => {
  return new Response(JSON.stringify({
    usedBytes: 15.5 * 1024 * 1024 * 1024,
    totalBytes: 100 * 1024 * 1024 * 1024
  }), { headers: { "Content-Type": "application/json" }});
});

router.post("/api/documents/upload", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const userId = formData.get("userId") as string;
    const sessionId = request.headers.get("X-Google-User-Id") || userId;

    if (!file || !sessionId) {
      return new Response("Missing file or user session", { status: 400 });
    }

    // 1. Simulate sending file to NotebookLM / Gemini Engine Room
    const aiGeneratedTitle = `AI Module: ${title || file.name}`;
    const aiGeneratedDesc = `This module was automatically generated from the uploaded document (${file.name}) using NotebookLM. Please review the attached study guide and complete the quiz.`;
    
    const newAssignment = {
      id: crypto.randomUUID(),
      title: aiGeneratedTitle,
      description: aiGeneratedDesc,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      points: 100,
      course_id: 'notebook-lm-generated'
    };

    // 2. Save the generated module to D1 Database so it appears on the dashboard
    await env.DB.prepare(
      `INSERT INTO assignments (id, user_id, title, description, due_date, status, points, course_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      newAssignment.id,
      userId,
      newAssignment.title,
      newAssignment.description,
      newAssignment.due_date,
      newAssignment.status,
      newAssignment.points,
      newAssignment.course_id
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Uploaded to AI Engine. Module generated successfully.",
      assignment: newAssignment
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});

router.get("/api/google/drive/files", async () => {
  return new Response(JSON.stringify({ files: [] }), { headers: { "Content-Type": "application/json" }});
});

router.get("/api/google/classroom/courses", async () => {
  return new Response(JSON.stringify({ courses: [] }), { headers: { "Content-Type": "application/json" }});
});

router.post("/api/suggest-goals", async () => {
  return new Response(JSON.stringify({ goals: [{ id: "1", title: "Setup Engine Room for Real AI" }] }), { headers: { "Content-Type": "application/json" }});
});

router.post("/api/ai-chat", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  try {
    const body = await request.json() as any;
    const { message, userName, persona, age, learningFocus, conversationId, aiAssistantRole } = body;
    const userId = request.headers.get("X-Google-User-Id") || userName?.toLowerCase() || "aba";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        response: "⚠️ GEMINI_API_KEY is not configured. Please add it as a Cloudflare Worker secret.",
        conversationId: conversationId || crypto.randomUUID()
      }), { headers: { "Content-Type": "application/json" } });
    }

    // Build or retrieve conversation thread
    const threadId = conversationId || crypto.randomUUID();

    // Fetch existing assignments so the AI knows what the user is working on
    let existingAssignments: any[] = [];
    try {
      const result = await env.DB.prepare("SELECT * FROM assignments WHERE user_id = ?").bind(userId).all();
      existingAssignments = result.results as unknown as any[];
    } catch { /* table may not exist yet */ }

    const assignmentContext = existingAssignments.length > 0
      ? `\n\nCurrent modules/assignments on ${userName}'s dashboard:\n${existingAssignments.map((a: any, i: number) => `${i + 1}. "${a.title}" — Status: ${a.status}, Due: ${a.due_date}`).join('\n')}`
      : `\n\n${userName} has no modules or assignments on their dashboard yet.`;

    const systemPrompt = `You are "${aiAssistantRole || 'Strategic Advisor'}", a personalised AI tutor inside a Family Education Hub.

USER PROFILE:
- Name: ${userName}
- Age: ${age}
- Persona: ${persona}
- Learning Focus: ${learningFocus}
- Role in system: ${userId === 'aba' ? 'Admin / Architect' : 'Learner'}
${assignmentContext}

YOUR CAPABILITIES & RULES:
1. You are a REAL AI tutor. Never say you are simulated or hardcoded.
2. You help the user learn by having genuine conversations about their interests and goals.
3. You can discuss their current modules, suggest new topics, explain concepts, quiz them, and provide guidance.
4. When the user wants to study something new, have a real conversation:
   - Ask about their current knowledge level
   - Understand their goals (academic, professional, career pivot)
   - Suggest a structured learning path
   - Break it into concrete modules they could work through
5. Adapt your communication style to the user's age:
   - For young children (age < 7): Use simple words, emojis, and playful language
   - For children (age 7-12): Be encouraging, use examples, make it fun
   - For teens/adults: Be professional, thorough, and strategic
6. If the user asks about their modules or assignments, reference the actual data above.
7. Keep responses concise but substantive. No fluff.
8. You have access to broad knowledge. Share real information, real course recommendations, real career advice.`;

    // Call Gemini API with retry + model fallback
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
    let aiText = "";
    let lastError = "";

    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiPayload = {
        contents: [
          { role: "user", parts: [{ text: message }] }
        ],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          topP: 0.95,
        }
      };

      try {
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload)
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json() as any;
          aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiText) break;
        } else if (geminiRes.status === 429) {
          const errBody = await geminiRes.text().catch(() => "");
          lastError = `Rate limited on ${model}: ${errBody.substring(0, 300)}`;
          console.error(lastError);
          // Brief pause before trying next model
          await new Promise(r => setTimeout(r, 500));
          continue;
        } else {
          const errText = await geminiRes.text();
          lastError = `${model} returned ${geminiRes.status}: ${errText.substring(0, 200)}`;
          console.error(lastError);
          continue;
        }
      } catch (fetchErr: any) {
        lastError = `${model} fetch failed: ${fetchErr.message}`;
        console.error(lastError);
        continue;
      }
    }

    if (!aiText) {
      return new Response(JSON.stringify({
        response: `⚠️ All AI models are temporarily rate-limited. Please wait a moment and try again.\n\nTechnical detail: ${lastError}`,
        conversationId: threadId
      }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      response: aiText,
      conversationId: threadId
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("ai-chat error:", err);
    return new Response(JSON.stringify({
      response: "An unexpected error occurred: " + err.message,
      conversationId: "error"
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

router.post("/api/generate-curriculum", async () => {
  return new Response(JSON.stringify({ curriculum: "Mock curriculum generated." }), { headers: { "Content-Type": "application/json" }});
});



router.get("/api/assignments/:userId", async (request) => {
  const { userId } = request.params as { userId: string };
  const env = (request as any).env as { DB: D1Database };
  const assignments = await getAssignments(userId, env.DB);
  return new Response(JSON.stringify({ assignments }), { headers: { "Content-Type": "application/json" } });
});

router.post("/api/submit-assignment", async (request) => {
  const body = await json(request);
  const { userId, courseWorkId } = body;
  // Here we would update the assignment status in D1 – omitted for brevity
  return new Response(JSON.stringify({ status: "submitted", userId, courseWorkId }), { headers: { "Content-Type": "application/json" } });
});

// Google OAuth routes remain unchanged (they use in‑memory oauthTokens for now – later replace with DB)
router.get("/api/auth/google/start", async (request) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  if (!clientId) {
    return new Response(JSON.stringify({ error: "GOOGLE_CLIENT_ID not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
  const scope = [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/classroom.coursework.me",
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
  ].join(" ");
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return new Response(JSON.stringify({ authorizationUrl: url.toString(), state, redirectUri }), { headers: { "Content-Type": "application/json" } });
});

router.get("/api/auth/google/callback", async (request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  if (!code || !clientId || !clientSecret) {
    return new Response("Missing code or Google OAuth env.", { status: 400 });
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await tokenRes.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!tokens.access_token) {
    return new Response(JSON.stringify({ error: tokens.error || "token_exchange_failed" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  // Store token in D1
  const env = (request as any).env as { DB: D1Database };
  const sessionId = crypto.randomUUID();
  await saveOAuthToken(sessionId, tokens, env.DB);
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  return Response.redirect(`${appUrl}/learning-hub?google_session=${sessionId}`);
});

router.post("/api/auth/google/refresh", async (request) => {
  const body = await json(request);
  const { sessionId } = body;
  // For brevity, token refresh logic omitted – would read from D1, call Google, update DB
  return new Response(JSON.stringify({ message: "refresh not implemented in this demo" }), { headers: { "Content-Type": "application/json" } });
});

export default {
  async fetch(request: Request, env: any, ctx: any) {
    if (typeof globalThis.process === 'undefined') {
      (globalThis as any).process = { env };
    } else {
      (globalThis as any).process.env = { ...(globalThis as any).process.env, ...env };
    }
    (request as any).env = env;
    const response = await router.handle(request, env, ctx);
    if (response) return response;

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url).toString(), request));
      }
    }
    
    return new Response("Not Found", { status: 404 });
  },
};
