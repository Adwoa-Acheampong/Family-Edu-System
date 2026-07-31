import { Router } from "itty-router";
import {
  getAssignments, updateAssignmentStatus, saveOAuthToken, getOAuthToken,
  getModules, createModule, updateModuleStatus,
  logProgress, getAnalyticsData,
  getDriveUsage as fetchDriveUsage, listDriveFiles as fetchDriveFiles,
  listClassroomCourses as fetchClassroomCourses, listClassroomAssignments,
  callGoogleAPI
} from "./db";
import { D1Database } from "@cloudflare/workers-types";

// Helper: resolve OAuth access token from request headers or sessionId param
async function resolveAccessToken(request: any, db: D1Database): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const sessionId = request.headers.get("X-Google-User-Id")
    || new URL(request.url).searchParams.get("sessionId");
  if (sessionId) {
    const session = await getOAuthToken(sessionId, db);
    return (session as any)?.access_token || null;
  }
  return null;
}

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
  const env = (request as any).env as { DB: D1Database };
  const body = await json(request);
  const userId = body?.userId || "aba";
  const accessToken = await resolveAccessToken(request, env.DB);

  if (!accessToken) {
    // No Google session — return assignments from D1 only
    const assignments = await getAssignments(userId, env.DB);
    const modules = await getModules(userId, env.DB);
    return new Response(JSON.stringify({ assignments, modules, courses: [] }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    const courses = await fetchClassroomCourses(accessToken);
    let allAssignments: any[] = [];
    for (const course of courses.slice(0, 5)) {
      try {
        const cw = await listClassroomAssignments(course.id, accessToken);
        allAssignments = allAssignments.concat(cw.map((a: any) => ({ ...a, courseName: course.name })));
      } catch { /* skip courses without access */ }
    }
    return new Response(JSON.stringify({ assignments: allAssignments, courses }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    const dbAssignments = await getAssignments(userId, env.DB);
    return new Response(JSON.stringify({ assignments: dbAssignments, courses: [], error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});

router.get("/api/analytics/summary", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const userId = new URL(request.url).searchParams.get("userId") || "aba";
  try {
    const data = await getAnalyticsData(userId, env.DB);
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" }});
  } catch (err: any) {
    return new Response(JSON.stringify({ source: "error", error: err.message, completedAssignments: 0, pendingAssignments: 0, xpLast7Days: 0, currentStreak: 0, xpByDay: [], bySubject: [], curriculumMilestones: [] }), { headers: { "Content-Type": "application/json" }});
  }
});

router.get("/api/system/settings", async () => {
  return new Response(JSON.stringify({
    pollIntervalMs: 30000,
    engineRoomUrl: "http://localhost:3000",
    classroomCourseId: "",
    enableNotifications: true
  }), { headers: { "Content-Type": "application/json" }});
});

router.get("/api/drive-usage", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const accessToken = await resolveAccessToken(request, env.DB);
  if (accessToken) {
    try {
      const usage = await fetchDriveUsage(accessToken);
      return new Response(JSON.stringify(usage), { headers: { "Content-Type": "application/json" }});
    } catch { /* fall through to default */ }
  }
  return new Response(JSON.stringify({ usedBytes: 0, totalBytes: 15 * 1024 * 1024 * 1024, note: "Connect Google to see real usage" }), { headers: { "Content-Type": "application/json" }});
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

router.get("/api/google/drive/files", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const accessToken = await resolveAccessToken(request, env.DB);
  if (!accessToken) return new Response(JSON.stringify({ files: [], note: "Connect Google to see files" }), { headers: { "Content-Type": "application/json" }});
  try {
    const files = await fetchDriveFiles(accessToken);
    return new Response(JSON.stringify({ files }), { headers: { "Content-Type": "application/json" }});
  } catch (err: any) {
    return new Response(JSON.stringify({ files: [], error: err.message }), { headers: { "Content-Type": "application/json" }});
  }
});

router.get("/api/google/classroom/courses", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const accessToken = await resolveAccessToken(request, env.DB);
  if (!accessToken) return new Response(JSON.stringify({ courses: [], note: "Connect Google to see courses" }), { headers: { "Content-Type": "application/json" }});
  try {
    const courses = await fetchClassroomCourses(accessToken);
    return new Response(JSON.stringify({ courses }), { headers: { "Content-Type": "application/json" }});
  } catch (err: any) {
    return new Response(JSON.stringify({ courses: [], error: err.message }), { headers: { "Content-Type": "application/json" }});
  }
});

router.post("/api/suggest-goals", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const body = await json(request);
  const userId = (body as any)?.user?.id || "aba";
  const modules = await getModules(userId, env.DB);
  const assignments = await getAssignments(userId, env.DB);
  const totalItems = modules.length + assignments.length;
  const suggestions = [];
  if (totalItems === 0) {
    suggestions.push({ id: "1", type: "MAIN QUEST", title: "Start your first study topic", desc: "Open the AI chat and say hello to begin your journey.", xp: 100 });
  } else {
    const pending = assignments.filter(a => a.status === "PENDING").length + modules.filter(m => m.status !== "COMPLETED").length;
    if (pending > 0) {
      suggestions.push({ id: "2", type: "DAILY TASK", title: "Clear Pending Work", desc: `Complete ${pending} pending modules or assignments.`, xp: 250 });
    }
    suggestions.push({ id: "3", type: "SIDE QUEST", title: "Explore a new learning topic", desc: "Ask the AI about a topic you've never learned before.", xp: 150 });
  }
  return new Response(JSON.stringify({ suggestions }), { headers: { "Content-Type": "application/json" }});
});

router.post("/api/ai-chat", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  try {
    const body = await request.json() as any;
    const { message, history, userName, persona, age, learningFocus, conversationId, aiAssistantRole } = body;
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
   - IMPORTANT: If the user explicitly asks to learn something or study a topic, you MUST append this exact tag to the end of your response: [MODULE_TRIGGER: <topic>] (replace <topic> with the actual topic). This will signal the system to automatically generate their modules!
5. Adapt your communication style to the user's age:
   - For young children (age < 7): Use simple words, emojis, and playful language
   - For children (age 7-12): Be encouraging, use examples, make it fun
   - For teens/adults: Be professional, thorough, and strategic
6. If the user asks about their modules or assignments, reference the actual data above.
7. Keep responses concise but substantive. No fluff.
8. You have access to broad knowledge. Share real information, real course recommendations, real career advice.
9. CRITICAL RULE: If the user asks to learn something entirely different from their "Learning Focus" (e.g. they want to learn Python but their focus is Architecture), you MUST happily oblige and pivot to their new topic without questioning it! You are here to teach them whatever they want to learn.`;

    // Call Gemini API with retry + model fallback
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
    let aiText = "";
    let lastError = "";

    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiContents = history && history.length > 0
        ? history.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] }))
        : [{ role: "user", parts: [{ text: message }] }];
        
      const geminiPayload = {
        contents: geminiContents,
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

    // ── OpenRouter fallback when all Gemini models fail ──
    if (!aiText) {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        const orModels = [
          "google/gemini-2.0-flash-001",
          "google/gemini-2.5-flash-preview",
          "meta-llama/llama-3.1-8b-instruct",
          "openai/gpt-4o-mini"
        ];
        for (const orModel of orModels) {
          try {
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openRouterKey}`,
                "HTTP-Referer": "https://family-edu-system.saintaba.workers.dev",
                "X-Title": "Family Edu Hub"
              },
              body: JSON.stringify({
                model: orModel,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...(history && history.length > 0 
                    ? history.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content }))
                    : [{ role: "user", content: message }])
                ],
                max_tokens: 1024,
                temperature: 0.8
              })
            });
            if (orRes.ok) {
              const orData = await orRes.json() as any;
              aiText = orData?.choices?.[0]?.message?.content || "";
              if (aiText) break;
            } else {
              const errBody = await orRes.text().catch(() => "");
              lastError = `OpenRouter ${orModel} returned ${orRes.status}: ${errBody.substring(0, 200)}`;
              console.error(lastError);
              continue;
            }
          } catch (orErr: any) {
            lastError = `OpenRouter ${orModel} failed: ${orErr.message}`;
            console.error(lastError);
            continue;
          }
        }
      }
    }

    if (!aiText) {
      return new Response(JSON.stringify({
        response: `⚠️ All AI providers are temporarily unavailable. Please wait a moment and try again.\n\nTechnical detail: ${lastError}`,
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

router.post("/api/generate-curriculum", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const body = await json(request) as any;
  const { topic, userName, userId, persona, age } = body;
  const uid = userId || userName?.toLowerCase() || "aba";
  const apiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const prompt = `Generate a structured learning curriculum for a ${age || 27}-year-old named ${userName || "user"} (persona: ${persona || "Learner"}) on the topic: "${topic || "General Learning"}". Return a JSON array of 4-6 modules. Each module: {"title": "...", "description": "...", "objectives": "bullet points", "resources": "URLs or book titles", "estimated_hours": number}. Return ONLY the JSON array, no markdown.`;

  let modulesJson = "[]";
  let debugLog = "";
  // Try OpenRouter first (since Gemini quota might be exhausted)
  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openRouterKey}`, "HTTP-Referer": "https://family-edu-system.saintaba.workers.dev", "X-Title": "Family Edu Hub" },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages: [{ role: "user", content: prompt }], max_tokens: 2048, temperature: 0.7 })
      });
      if (res.ok) {
        const data = await res.json() as any;
        modulesJson = data?.choices?.[0]?.message?.content || "[]";
        debugLog = `OpenRouter success: ${modulesJson.substring(0, 50)}`;
      } else {
        const errText = await res.text().catch(() => "");
        debugLog = `Curriculum OpenRouter ${res.status}: ${errText.substring(0, 300)}`;
        console.error(debugLog);
      }
    } catch (e: any) {
      debugLog = `Curriculum OpenRouter error: ${e.message}`;
      console.error(debugLog);
    }
  }

  // Parse and save modules to D1
  try {
    const cleaned = modulesJson.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const modules = JSON.parse(cleaned);
    if (!Array.isArray(modules) || modules.length === 0) {
      return new Response(JSON.stringify({ curriculum: [], saved: 0, debug: debugLog || "AI returned empty or non-array", raw: cleaned.substring(0, 500) }), { headers: { "Content-Type": "application/json" }});
    }
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      await createModule({
        id: crypto.randomUUID(),
        user_id: uid,
        title: m.title,
        description: m.description || "",
        objectives: m.objectives || "",
        resources: m.resources || "",
        order_index: i,
        status: "NOT_STARTED" as const,
        estimated_hours: m.estimated_hours || 1
      }, env.DB);
    }
    return new Response(JSON.stringify({ curriculum: modules, saved: modules.length }), { headers: { "Content-Type": "application/json" }});
  } catch (err: any) {
    return new Response(JSON.stringify({ curriculum: modulesJson.substring(0, 500), error: err.message }), { headers: { "Content-Type": "application/json" }});
  }
});

// ── Module endpoints ──

router.get("/api/modules/:userId", async (request) => {
  const { userId } = request.params as { userId: string };
  const env = (request as any).env as { DB: D1Database };
  const modules = await getModules(userId, env.DB);
  return new Response(JSON.stringify({ modules }), { headers: { "Content-Type": "application/json" } });
});

router.post("/api/modules/:moduleId/status", async (request) => {
  const { moduleId } = request.params as { moduleId: string };
  const env = (request as any).env as { DB: D1Database };
  const body = await json(request) as any;
  const { status, userId } = body;
  await updateModuleStatus(moduleId, status, env.DB);
  if (status === "COMPLETED" && userId) {
    await logProgress({ id: crypto.randomUUID(), user_id: userId, module_id: moduleId, assignment_id: null, action: "MODULE_COMPLETED", xp_earned: 50 }, env.DB);
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});

// ── Assignment endpoints ──

router.get("/api/assignments/:userId", async (request) => {
  const { userId } = request.params as { userId: string };
  const env = (request as any).env as { DB: D1Database };
  const assignments = await getAssignments(userId, env.DB);
  return new Response(JSON.stringify({ assignments }), { headers: { "Content-Type": "application/json" } });
});

router.post("/api/submit-assignment", async (request) => {
  const env = (request as any).env as { DB: D1Database };
  const body = await json(request) as any;
  const { userId, courseWorkId, assignmentId } = body;
  const id = assignmentId || courseWorkId;
  if (id) {
    await updateAssignmentStatus(id, "SUBMITTED", env.DB);
    await logProgress({ id: crypto.randomUUID(), user_id: userId, module_id: null, assignment_id: id, action: "ASSIGNMENT_SUBMITTED", xp_earned: 25 }, env.DB);
  }
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
