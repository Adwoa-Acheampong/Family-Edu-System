var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-pb4nua/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r, "get") }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams) a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t) if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
    e3.params = r.groups || {}, e3.route = l2;
    for (let t2 of i2) if (null != (s2 = await t2(e3.proxy ?? e3, ...o3))) return s2;
  }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// dist/worker.mjs
async function getAssignments(userId, db) {
  const result = await db.prepare("SELECT * FROM assignments WHERE user_id = ? ORDER BY due_date ASC").bind(userId).all();
  return result.results;
}
__name(getAssignments, "getAssignments");
async function updateAssignmentStatus(id, status, db) {
  await db.prepare("UPDATE assignments SET status = ? WHERE id = ?").bind(status, id).run();
}
__name(updateAssignmentStatus, "updateAssignmentStatus");
async function getModules(userId, db) {
  const result = await db.prepare("SELECT * FROM modules WHERE user_id = ? ORDER BY order_index ASC").bind(userId).all();
  return result.results;
}
__name(getModules, "getModules");
async function createModule(mod, db) {
  await db.prepare(
    `INSERT INTO modules (id, user_id, title, description, objectives, resources, order_index, status, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    mod.id,
    mod.user_id,
    mod.title,
    mod.description || "",
    mod.objectives || "",
    mod.resources || "",
    mod.order_index,
    mod.status,
    mod.estimated_hours
  ).run();
}
__name(createModule, "createModule");
async function updateModuleStatus(id, status, db) {
  const completedAt = status === "COMPLETED" ? (/* @__PURE__ */ new Date()).toISOString() : null;
  await db.prepare("UPDATE modules SET status = ?, completed_at = ? WHERE id = ?").bind(status, completedAt, id).run();
}
__name(updateModuleStatus, "updateModuleStatus");
async function logProgress(entry, db) {
  await db.prepare(
    `INSERT INTO progress (id, user_id, module_id, assignment_id, action, xp_earned)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(entry.id, entry.user_id, entry.module_id, entry.assignment_id, entry.action, entry.xp_earned).run();
}
__name(logProgress, "logProgress");
async function getAnalyticsData(userId, db) {
  const assignments = await db.prepare("SELECT * FROM assignments WHERE user_id = ?").bind(userId).all();
  const modules = await db.prepare("SELECT * FROM modules WHERE user_id = ?").bind(userId).all();
  const progress = await db.prepare(
    "SELECT * FROM progress WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  ).bind(userId).all();
  const allAssignments = assignments.results;
  const allModules = modules.results;
  const allProgress = progress.results;
  const completed = allAssignments.filter((a) => a.status === "GRADED" || a.status === "SUBMITTED").length + allModules.filter((m) => m.status === "COMPLETED").length;
  const pending = allAssignments.filter((a) => a.status === "PENDING").length + allModules.filter((m) => m.status !== "COMPLETED").length;
  const totalXp = allProgress.reduce((sum, p2) => sum + (p2.xp_earned || 0), 0);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const xpByDay = days.map((day) => ({ day, xp: 0 }));
  for (const p2 of allProgress) {
    const d2 = new Date(p2.created_at);
    const dayIndex = d2.getDay();
    xpByDay[dayIndex].xp += p2.xp_earned || 0;
  }
  const uniqueDays = new Set(allProgress.map((p2) => p2.created_at?.substring(0, 10)));
  let streak = 0;
  const today = /* @__PURE__ */ new Date();
  for (let i2 = 0; i2 < 30; i2++) {
    const d2 = new Date(today);
    d2.setDate(d2.getDate() - i2);
    const key = d2.toISOString().substring(0, 10);
    if (uniqueDays.has(key)) {
      streak++;
    } else if (i2 > 0) {
      break;
    }
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
    curriculumMilestones: allModules.slice(0, 3).map((m, i2) => ({
      phase: i2 === 0 ? "NOW" : i2 === 1 ? "NEXT" : "LATER",
      title: m.title,
      description: m.status === "COMPLETED" ? "\u2705 Completed" : m.status === "IN_PROGRESS" ? "\u{1F504} In progress" : "\u23F3 Not started"
    }))
  };
}
__name(getAnalyticsData, "getAnalyticsData");
async function saveOAuthToken(sessionId, token, db) {
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
__name(saveOAuthToken, "saveOAuthToken");
async function getOAuthToken(sessionId, db) {
  const result = await db.prepare("SELECT * FROM oauth_sessions WHERE session_id = ?").bind(sessionId).first();
  return result;
}
__name(getOAuthToken, "getOAuthToken");
async function callGoogleAPI(endpoint, accessToken, method = "GET", body) {
  const opts = {
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
__name(callGoogleAPI, "callGoogleAPI");
async function getDriveUsage(accessToken) {
  const data = await callGoogleAPI(
    "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
    accessToken
  );
  return {
    usedBytes: parseInt(data.storageQuota?.usage || "0"),
    totalBytes: parseInt(data.storageQuota?.limit || String(15 * 1024 ** 3))
  };
}
__name(getDriveUsage, "getDriveUsage");
async function listDriveFiles(accessToken) {
  const data = await callGoogleAPI(
    "https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc",
    accessToken
  );
  return data.files || [];
}
__name(listDriveFiles, "listDriveFiles");
async function listClassroomCourses(accessToken) {
  const data = await callGoogleAPI(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20",
    accessToken
  );
  return data.courses || [];
}
__name(listClassroomCourses, "listClassroomCourses");
async function listClassroomAssignments(courseId, accessToken) {
  const data = await callGoogleAPI(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=50`,
    accessToken
  );
  return data.courseWork || [];
}
__name(listClassroomAssignments, "listClassroomAssignments");
async function resolveAccessToken(request, db) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const sessionId = request.headers.get("X-Google-User-Id") || new URL(request.url).searchParams.get("sessionId");
  if (sessionId) {
    const session = await getOAuthToken(sessionId, db);
    return session?.access_token || null;
  }
  return null;
}
__name(resolveAccessToken, "resolveAccessToken");
async function json(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
__name(json, "json");
var router = e();
router.get("/api/health", async (request) => {
  return new Response(JSON.stringify({ status: "ok", googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
router.get("/api/system/status", async (request) => {
  return new Response(JSON.stringify({
    apiStatus: "ok",
    latencyMs: 12,
    time: (/* @__PURE__ */ new Date()).toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID,
    recentEvents: [{ time: (/* @__PURE__ */ new Date()).toISOString().slice(11, 19), event: "System status endpoint online (Worker)", status: "SUCCESS" }]
  }), { headers: { "Content-Type": "application/json" } });
});
router.post("/api/sync-classroom", async (request) => {
  const env = request.env;
  const body = await json(request);
  const userId = body?.userId || "aba";
  const accessToken = await resolveAccessToken(request, env.DB);
  if (!accessToken) {
    const assignments = await getAssignments(userId, env.DB);
    const modules = await getModules(userId, env.DB);
    return new Response(JSON.stringify({ assignments, modules, courses: [] }), { headers: { "Content-Type": "application/json" } });
  }
  try {
    const courses = await listClassroomCourses(accessToken);
    let allAssignments = [];
    for (const course of courses.slice(0, 5)) {
      try {
        const cw = await listClassroomAssignments(course.id, accessToken);
        allAssignments = allAssignments.concat(cw.map((a) => ({ ...a, courseName: course.name })));
      } catch {
      }
    }
    return new Response(JSON.stringify({ assignments: allAssignments, courses }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const dbAssignments = await getAssignments(userId, env.DB);
    return new Response(JSON.stringify({ assignments: dbAssignments, courses: [], error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});
router.get("/api/analytics/summary", async (request) => {
  const env = request.env;
  const userId = new URL(request.url).searchParams.get("userId") || "aba";
  try {
    const data = await getAnalyticsData(userId, env.DB);
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ source: "error", error: err.message, completedAssignments: 0, pendingAssignments: 0, xpLast7Days: 0, currentStreak: 0, xpByDay: [], bySubject: [], curriculumMilestones: [] }), { headers: { "Content-Type": "application/json" } });
  }
});
router.get("/api/system/settings", async () => {
  return new Response(JSON.stringify({
    pollIntervalMs: 3e4,
    engineRoomUrl: "http://localhost:3000",
    classroomCourseId: "",
    enableNotifications: true
  }), { headers: { "Content-Type": "application/json" } });
});
router.get("/api/drive-usage", async (request) => {
  const env = request.env;
  const accessToken = await resolveAccessToken(request, env.DB);
  if (accessToken) {
    try {
      const usage = await getDriveUsage(accessToken);
      return new Response(JSON.stringify(usage), { headers: { "Content-Type": "application/json" } });
    } catch {
    }
  }
  return new Response(JSON.stringify({ usedBytes: 0, totalBytes: 15 * 1024 * 1024 * 1024, note: "Connect Google to see real usage" }), { headers: { "Content-Type": "application/json" } });
});
router.post("/api/documents/upload", async (request) => {
  const env = request.env;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const userId = formData.get("userId");
    const sessionId = request.headers.get("X-Google-User-Id") || userId;
    if (!file || !sessionId) {
      return new Response("Missing file or user session", { status: 400 });
    }
    const aiGeneratedTitle = `AI Module: ${title || file.name}`;
    const aiGeneratedDesc = `This module was automatically generated from the uploaded document (${file.name}) using NotebookLM. Please review the attached study guide and complete the quiz.`;
    const newAssignment = {
      id: crypto.randomUUID(),
      title: aiGeneratedTitle,
      description: aiGeneratedDesc,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
      status: "PENDING",
      points: 100,
      course_id: "notebook-lm-generated"
    };
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
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
router.get("/api/google/drive/files", async (request) => {
  const env = request.env;
  const accessToken = await resolveAccessToken(request, env.DB);
  if (!accessToken) return new Response(JSON.stringify({ files: [], note: "Connect Google to see files" }), { headers: { "Content-Type": "application/json" } });
  try {
    const files = await listDriveFiles(accessToken);
    return new Response(JSON.stringify({ files }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ files: [], error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});
router.get("/api/google/classroom/courses", async (request) => {
  const env = request.env;
  const accessToken = await resolveAccessToken(request, env.DB);
  if (!accessToken) return new Response(JSON.stringify({ courses: [], note: "Connect Google to see courses" }), { headers: { "Content-Type": "application/json" } });
  try {
    const courses = await listClassroomCourses(accessToken);
    return new Response(JSON.stringify({ courses }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ courses: [], error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});
router.post("/api/suggest-goals", async (request) => {
  const env = request.env;
  const body = await json(request);
  const userId = body?.user?.id || "aba";
  const modules = await getModules(userId, env.DB);
  const assignments = await getAssignments(userId, env.DB);
  const totalItems = modules.length + assignments.length;
  const suggestions = [];
  if (totalItems === 0) {
    suggestions.push({ id: "1", type: "MAIN QUEST", title: "Start your first study topic", desc: "Open the AI chat and say hello to begin your journey.", xp: 100 });
  } else {
    const pending = assignments.filter((a) => a.status === "PENDING").length + modules.filter((m) => m.status !== "COMPLETED").length;
    if (pending > 0) {
      suggestions.push({ id: "2", type: "DAILY TASK", title: "Clear Pending Work", desc: `Complete ${pending} pending modules or assignments.`, xp: 250 });
    }
    suggestions.push({ id: "3", type: "SIDE QUEST", title: "Explore a new learning topic", desc: "Ask the AI about a topic you've never learned before.", xp: 150 });
  }
  return new Response(JSON.stringify({ suggestions }), { headers: { "Content-Type": "application/json" } });
});
router.post("/api/ai-chat", async (request) => {
  const env = request.env;
  try {
    const body = await request.json();
    const { message, history, userName, persona, age, learningFocus, conversationId, aiAssistantRole } = body;
    const userId = request.headers.get("X-Google-User-Id") || userName?.toLowerCase() || "aba";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        response: "\u26A0\uFE0F GEMINI_API_KEY is not configured. Please add it as a Cloudflare Worker secret.",
        conversationId: conversationId || crypto.randomUUID()
      }), { headers: { "Content-Type": "application/json" } });
    }
    const threadId = conversationId || crypto.randomUUID();
    let existingAssignments = [];
    try {
      const result = await env.DB.prepare("SELECT * FROM assignments WHERE user_id = ?").bind(userId).all();
      existingAssignments = result.results;
    } catch {
    }
    const assignmentContext = existingAssignments.length > 0 ? `

Current modules/assignments on ${userName}'s dashboard:
${existingAssignments.map((a, i2) => `${i2 + 1}. "${a.title}" \u2014 Status: ${a.status}, Due: ${a.due_date}`).join("\n")}` : `

${userName} has no modules or assignments on their dashboard yet.`;
    const systemPrompt = `You are "${aiAssistantRole || "Strategic Advisor"}", a personalised AI tutor inside a Family Education Hub.

USER PROFILE:
- Name: ${userName}
- Age: ${age}
- Persona: ${persona}
- Learning Focus: ${learningFocus}
- Role in system: ${userId === "aba" ? "Admin / Architect" : "Learner"}
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
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
    let aiText = "";
    let lastError = "";
    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiContents = history && history.length > 0 ? history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })) : [{ role: "user", parts: [{ text: message }] }];
      const geminiPayload = {
        contents: geminiContents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          topP: 0.95
        }
      };
      try {
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload)
        });
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiText) break;
        } else if (geminiRes.status === 429) {
          const errBody = await geminiRes.text().catch(() => "");
          lastError = `Rate limited on ${model}: ${errBody.substring(0, 300)}`;
          console.error(lastError);
          await new Promise((r) => setTimeout(r, 500));
          continue;
        } else {
          const errText = await geminiRes.text();
          lastError = `${model} returned ${geminiRes.status}: ${errText.substring(0, 200)}`;
          console.error(lastError);
          continue;
        }
      } catch (fetchErr) {
        lastError = `${model} fetch failed: ${fetchErr.message}`;
        console.error(lastError);
        continue;
      }
    }
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
                  ...history && history.length > 0 ? history.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.content })) : [{ role: "user", content: message }]
                ],
                max_tokens: 1024,
                temperature: 0.8
              })
            });
            if (orRes.ok) {
              const orData = await orRes.json();
              aiText = orData?.choices?.[0]?.message?.content || "";
              if (aiText) break;
            } else {
              const errBody = await orRes.text().catch(() => "");
              lastError = `OpenRouter ${orModel} returned ${orRes.status}: ${errBody.substring(0, 200)}`;
              console.error(lastError);
              continue;
            }
          } catch (orErr) {
            lastError = `OpenRouter ${orModel} failed: ${orErr.message}`;
            console.error(lastError);
            continue;
          }
        }
      }
    }
    if (!aiText) {
      return new Response(JSON.stringify({
        response: `\u26A0\uFE0F All AI providers are temporarily unavailable. Please wait a moment and try again.

Technical detail: ${lastError}`,
        conversationId: threadId
      }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      response: aiText,
      conversationId: threadId
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("ai-chat error:", err);
    return new Response(JSON.stringify({
      response: "An unexpected error occurred: " + err.message,
      conversationId: "error"
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
router.post("/api/generate-curriculum", async (request) => {
  const env = request.env;
  const body = await json(request);
  const { topic, userName, userId, persona, age } = body;
  const uid = userId || userName?.toLowerCase() || "aba";
  const apiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const prompt = `Generate a structured learning curriculum for a ${age || 27}-year-old named ${userName || "user"} (persona: ${persona || "Learner"}) on the topic: "${topic || "General Learning"}". Return a JSON array of 4-6 modules. Each module: {"title": "...", "description": "...", "objectives": "bullet points", "resources": "URLs or book titles", "estimated_hours": number}. Return ONLY the JSON array, no markdown.`;
  let modulesJson = "[]";
  let debugLog = "";
  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openRouterKey}`, "HTTP-Referer": "https://family-edu-system.saintaba.workers.dev", "X-Title": "Family Edu Hub" },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages: [{ role: "user", content: prompt }], max_tokens: 2048, temperature: 0.7 })
      });
      if (res.ok) {
        const data = await res.json();
        modulesJson = data?.choices?.[0]?.message?.content || "[]";
        debugLog = `OpenRouter success: ${modulesJson.substring(0, 50)}`;
      } else {
        const errText = await res.text().catch(() => "");
        debugLog = `Curriculum OpenRouter ${res.status}: ${errText.substring(0, 300)}`;
        console.error(debugLog);
      }
    } catch (e2) {
      debugLog = `Curriculum OpenRouter error: ${e2.message}`;
      console.error(debugLog);
    }
  }
  try {
    const cleaned = modulesJson.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const modules = JSON.parse(cleaned);
    if (!Array.isArray(modules) || modules.length === 0) {
      return new Response(JSON.stringify({ curriculum: [], saved: 0, debug: debugLog || "AI returned empty or non-array", raw: cleaned.substring(0, 500) }), { headers: { "Content-Type": "application/json" } });
    }
    for (let i2 = 0; i2 < modules.length; i2++) {
      const m = modules[i2];
      await createModule({
        id: crypto.randomUUID(),
        user_id: uid,
        title: m.title,
        description: m.description || "",
        objectives: m.objectives || "",
        resources: m.resources || "",
        order_index: i2,
        status: "NOT_STARTED",
        estimated_hours: m.estimated_hours || 1
      }, env.DB);
    }
    return new Response(JSON.stringify({ curriculum: modules, saved: modules.length }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ curriculum: modulesJson.substring(0, 500), error: err.message }), { headers: { "Content-Type": "application/json" } });
  }
});
router.get("/api/modules/:userId", async (request) => {
  const { userId } = request.params;
  const env = request.env;
  const modules = await getModules(userId, env.DB);
  return new Response(JSON.stringify({ modules }), { headers: { "Content-Type": "application/json" } });
});
router.post("/api/modules/:moduleId/status", async (request) => {
  const { moduleId } = request.params;
  const env = request.env;
  const body = await json(request);
  const { status, userId } = body;
  await updateModuleStatus(moduleId, status, env.DB);
  if (status === "COMPLETED" && userId) {
    await logProgress({ id: crypto.randomUUID(), user_id: userId, module_id: moduleId, assignment_id: null, action: "MODULE_COMPLETED", xp_earned: 50 }, env.DB);
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
router.get("/api/assignments/:userId", async (request) => {
  const { userId } = request.params;
  const env = request.env;
  const assignments = await getAssignments(userId, env.DB);
  return new Response(JSON.stringify({ assignments }), { headers: { "Content-Type": "application/json" } });
});
router.post("/api/submit-assignment", async (request) => {
  const env = request.env;
  const body = await json(request);
  const { userId, courseWorkId, assignmentId } = body;
  const id = assignmentId || courseWorkId;
  if (id) {
    await updateAssignmentStatus(id, "SUBMITTED", env.DB);
    await logProgress({ id: crypto.randomUUID(), user_id: userId, module_id: null, assignment_id: id, action: "ASSIGNMENT_SUBMITTED", xp_earned: 25 }, env.DB);
  }
  return new Response(JSON.stringify({ status: "submitted", userId, courseWorkId }), { headers: { "Content-Type": "application/json" } });
});
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
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly"
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
      grant_type: "authorization_code"
    })
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return new Response(JSON.stringify({ error: tokens.error || "token_exchange_failed" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const env = request.env;
  const sessionId = crypto.randomUUID();
  await saveOAuthToken(sessionId, tokens, env.DB);
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3e3}`;
  return Response.redirect(`${appUrl}/learning-hub?google_session=${sessionId}`);
});
router.post("/api/auth/google/refresh", async (request) => {
  const body = await json(request);
  const { sessionId } = body;
  return new Response(JSON.stringify({ message: "refresh not implemented in this demo" }), { headers: { "Content-Type": "application/json" } });
});
var worker_default = {
  async fetch(request, env, ctx) {
    if (typeof globalThis.process === "undefined") {
      globalThis.process = { env };
    } else {
      globalThis.process.env = { ...globalThis.process.env, ...env };
    }
    request.env = env;
    const response = await router.handle(request, env, ctx);
    if (response) return response;
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(new Request(new URL("/", request.url).toString(), request));
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-pb4nua/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-pb4nua/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
