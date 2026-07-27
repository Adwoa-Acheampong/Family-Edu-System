import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** In-memory conversation history keyed by conversationId */
const conversationHistory: Record<string, { role: string; parts: { text: string }[] }[]> = {};

/** Mock assignment store (per-user id) — replaced by Classroom later */
const mockAssignments: Record<
  string,
  {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: "PENDING" | "SUBMITTED" | "GRADED";
    points: number;
    courseId: string;
  }[]
> = {
  aba: [
    {
      id: "cw_aba_1",
      title: "Enterprise Architecture Analysis",
      description: "Map current-state services and risks.",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "PENDING",
      points: 100,
      courseId: "course_family",
    },
    {
      id: "cw_aba_2",
      title: "BABOK Knowledge Area Review",
      description: "Summarize requirements lifecycle.",
      dueDate: new Date(Date.now() + 8 * 86400000).toISOString(),
      status: "SUBMITTED",
      points: 80,
      courseId: "course_family",
    },
  ],
  badu: [
    {
      id: "cw_badu_1",
      title: "Lasagna Layering Practice",
      description: "Complete steps 4–7 of the recipe card.",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      status: "PENDING",
      points: 50,
      courseId: "course_kitchen",
    },
  ],
  kobby: [
    {
      id: "cw_kobby_1",
      title: "Python Variables & Types",
      description: "Master the basics of data storage.",
      dueDate: new Date().toISOString(),
      status: "GRADED",
      points: 150,
      courseId: "course_coding",
    },
    {
      id: "cw_kobby_2",
      title: "Loops & Logic Challenge",
      description: "Write a program to sort a list of numbers.",
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: "PENDING",
      points: 300,
      courseId: "course_coding",
    },
  ],
  pappy: [
    {
      id: "cw_pappy_1",
      title: "Planet Name Quest",
      description: "Name the planets in order from the sun.",
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: "PENDING",
      points: 40,
      courseId: "course_adventure",
    },
  ],
  seth: [
    {
      id: "cw_seth_1",
      title: "Letter Hunt: S",
      description: "Find five things that start with S.",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      status: "PENDING",
      points: 30,
      courseId: "course_adventure",
    },
  ],
  kweku: [
    {
      id: "cw_kweku_1",
      title: "Shape Song",
      description: "Tap circle, square, and star.",
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: "PENDING",
      points: 20,
      courseId: "course_play",
    },
  ],
  shee: [
    {
      id: "cw_shee_1",
      title: "Animal Sounds",
      description: "Make the cow and dog sounds.",
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: "PENDING",
      points: 10,
      courseId: "course_seedling",
    },
  ],
};

/** Optional in-memory OAuth token store (dev only — Engine Room will own real tokens) */
const oauthTokens: Record<
  string,
  { access_token: string; refresh_token?: string; expires_at: number; email?: string; name?: string }
> = {};

function normalizePersonaKey(persona: string, aiAssistantRole?: string): string {
  const p = `${persona || ""} ${aiAssistantRole || ""}`.toLowerCase();
  if (p.includes("architect") || p.includes("strategic")) return "architect";
  if (p.includes("master") || p.includes("patient companion")) return "master";
  if (p.includes("analyst") || p.includes("tech mentor")) return "analyst";
  if (p.includes("explorer") || p.includes("storyteller")) return "explorer";
  if (p.includes("adventurer") || p.includes("adventure guide")) return "adventurer";
  if (p.includes("discoverer") || p.includes("playmate")) return "discoverer";
  if (p.includes("seedling") || p.includes("nurturer")) return "seedling";
  return "default";
}

function buildSystemPrompt(opts: {
  persona: string;
  userName: string;
  age: number;
  learningFocus: string;
  aiAssistantRole?: string;
}): string {
  const key = normalizePersonaKey(opts.persona, opts.aiAssistantRole);
  const map: Record<string, { role: string; goal: string; tone: string; complexity: string }> = {
    architect: {
      role: "Strategic Advisor",
      goal: "provide analytical insights, vet strategic plans, and troubleshoot technical challenges related to Enterprise Architecture",
      tone: "professional, analytical, and concise",
      complexity: "advanced, technical",
    },
    master: {
      role: "Patient Companion",
      goal: "guide through practical steps, answer how-to questions, and offer encouraging words",
      tone: "warm, encouraging, and clear",
      complexity: "simple, practical",
    },
    analyst: {
      role: "Tech Mentor",
      goal: "explain coding concepts, provide engaging challenges, and track quest progress",
      tone: "enthusiastic, challenging, and supportive",
      complexity: "intermediate, technical",
    },
    explorer: {
      role: "Storyteller",
      goal: "narrate lessons, guide through interactive games, and make learning an adventure",
      tone: "playful, imaginative, and gentle",
      complexity: "simple, narrative",
    },
    adventurer: {
      role: "Adventure Guide",
      goal: "make reading, counting, and nature feel like a fun quest",
      tone: "cheerful, encouraging, and clear",
      complexity: "simple language a first-grader understands. Keep answers short. Celebrate effort. Avoid scary content",
    },
    discoverer: {
      role: "Playmate",
      goal: "encourage exploration, celebrate small wins, and make learning fun",
      tone: "cheerful, encouraging, and simple",
      complexity: "very simple, direct",
    },
    seedling: {
      role: "Nurturer",
      goal: "name objects, play gentle word games, and provide a comforting presence",
      tone: "soothing, gentle, and very simple",
      complexity: "extremely simple, repetitive",
    },
    default: {
      role: opts.aiAssistantRole || "Learning Assistant",
      goal: "help with learning goals",
      tone: "friendly and clear",
      complexity: "age-appropriate",
    },
  };
  const m = map[key] || map.default;
  return `You are a ${m.role} for a ${opts.age}-year-old named ${opts.userName}.
Your primary goal is to ${m.goal}.
Maintain a ${m.tone} tone and use ${m.complexity} language.
Current Learning Context: ${opts.learningFocus}.
Do not break character.`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));

  // ---------- Health ----------
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      gemini: Boolean(process.env.GEMINI_API_KEY),
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      time: new Date().toISOString(),
    });
  });

  // ---------- Mock Classroom sync ----------
  app.post("/api/sync-classroom", (req, res) => {
    const userId = (req.body?.userId as string) || "aba";
    const assignments = mockAssignments[userId] || [];
    res.json({ assignments });
  });

  app.get("/api/assignments/:userId", (req, res) => {
    res.json({ assignments: mockAssignments[req.params.userId] || [] });
  });

  // ---------- Drive usage (mock until real Google tokens) ----------
  app.get("/api/drive-usage", (req, res) => {
    const userId = (req.query.userId as string) || "default";
    // Deterministic mock per user
    const seed = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const used = 1.2e9 + (seed % 20) * 1e8;
    const total = 15e9;
    res.json({
      used,
      total,
      free: total - used,
      percentage: Math.round((used / total) * 1000) / 10,
      source: "mock",
    });
  });

  // ---------- Suggest goals (Gemini) ----------
  app.post("/api/suggest-goals", async (req, res) => {
    try {
      const { user } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          suggestions: [
            {
              title: "Practice session",
              desc: `Continue ${user?.learningFocus || "learning"} with one focused block.`,
              xp: 100,
              type: "MAIN QUEST",
            },
            {
              title: "Review notes",
              desc: "Spend 15 minutes reviewing yesterday's work.",
              xp: 50,
              type: "SIDE QUEST",
            },
            {
              title: "Teach-back",
              desc: "Explain one idea out loud to someone at home.",
              xp: 75,
              type: "SIDE QUEST",
            },
          ],
        });
      }

      const prompt = `Based on the following user profile, suggest 3 new daily learning objectives or quests.
User: ${user.name}
Role: ${user.persona}
Learning Focus: ${user.learningFocus}
Age: ${user.age}

Output only a JSON array of objects, where each object has:
- title: A short, catchy title (string)
- desc: A brief description of the objective (string)
- xp: An integer representing XP value (e.g. 100, 200, 300)
- type: A string like "MAIN QUEST" or "SIDE QUEST"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating goals:", error);
      res.status(500).json({ error: "Failed to generate goals" });
    }
  });

  // ---------- AI chat (Gemini + persona prompts) ----------
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const {
        message,
        persona,
        userName,
        age,
        learningFocus,
        conversationId,
        aiAssistantRole,
      } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required" });
      }

      const systemPrompt = buildSystemPrompt({
        persona: persona || "",
        userName: userName || "Learner",
        age: typeof age === "number" ? age : 10,
        learningFocus: learningFocus || "general learning",
        aiAssistantRole,
      });

      const convId = conversationId || randomUUID();
      if (!conversationHistory[convId]) conversationHistory[convId] = [];

      conversationHistory[convId].push({
        role: "user",
        parts: [{ text: message }],
      });

      if (conversationHistory[convId].length > 10) {
        conversationHistory[convId] = conversationHistory[convId].slice(-10);
      }

      if (!process.env.GEMINI_API_KEY) {
        const fallback = `Hi ${userName || "there"}! (Demo mode — set GEMINI_API_KEY for live AI.) You asked about: "${message.slice(0, 120)}"`;
        conversationHistory[convId].push({
          role: "model",
          parts: [{ text: fallback }],
        });
        return res.json({ response: fallback, conversationId: convId, demo: true });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: conversationHistory[convId],
        config: { systemInstruction: systemPrompt },
      });

      const reply = response.text || "I'm not sure how to respond to that.";

      conversationHistory[convId].push({
        role: "model",
        parts: [{ text: reply }],
      });

      res.json({ response: reply, conversationId: convId });
    } catch (error) {
      console.error("Error in ai-chat:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // ---------- Submit assignment (mock → real Classroom later) ----------
  app.post("/api/submit-assignment", async (req, res) => {
    try {
      const { courseId, courseWorkId, textResponse, fileName, userId } = req.body;
      await new Promise((r) => setTimeout(r, 400));

      const uid = userId || "kobby";
      const list = mockAssignments[uid];
      if (list && courseWorkId) {
        const item = list.find((a) => a.id === courseWorkId);
        if (item) item.status = "SUBMITTED";
      }

      res.json({
        status: "submitted",
        submissionId: `sub_${Date.now()}`,
        courseId: courseId || null,
        courseWorkId: courseWorkId || null,
        receivedText: Boolean(textResponse),
        receivedFileName: fileName || null,
        note: "Mock submit — wire to Google Classroom via Engine Room when ready",
      });
    } catch (error) {
      console.error("Error in submit-assignment:", error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // ---------- Curriculum generation (Gemini) ----------
  app.post("/api/generate-curriculum", async (req, res) => {
    try {
      const { persona, topic, goalId, userName, age } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          studyMaterials: [
            {
              type: "article",
              title: `${topic || "Learning"} basics`,
              url: "#",
            },
          ],
          assignment: {
            title: `Practice: ${topic || "Today's skill"}`,
            description: "Complete a short practice block.",
            rubric: "Effort 50%, Accuracy 50%",
          },
          demo: true,
        });
      }

      const prompt = `Create a short study block for ${userName || "a learner"} (age ${age || "n/a"}), persona ${persona}, topic "${topic}", goalId ${goalId || "n/a"}.
Return JSON with:
- studyMaterials: array of { type, title, url }
- assignment: { title, description, rubric }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Error generate-curriculum:", error);
      res.status(500).json({ error: "Failed to generate curriculum" });
    }
  });

  // ---------- Google OAuth scaffold (layer 3) ----------
  // Full token exchange needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
  // Production isolation stays with Engine Room; this enables frontend wiring now.

  app.get("/api/auth/google/start", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.APP_URL || `http://localhost:${PORT}`}/api/auth/google/callback`;

    if (!clientId) {
      return res.status(503).json({
        error: "GOOGLE_CLIENT_ID not configured",
        hint: "Add Google OAuth client credentials to env. Scopes needed: profile email drive.file classroom.coursework.me classroom.student-submissions.me",
      });
    }

    const scope = [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/classroom.coursework.me",
      "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    ].join(" ");

    const state = randomUUID();
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    res.json({ authorizationUrl: url.toString(), state, redirectUri });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.APP_URL || `http://localhost:${PORT}`}/api/auth/google/callback`;

    if (!code || !clientId || !clientSecret) {
      return res
        .status(400)
        .send("Missing code or Google OAuth env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
    }

    try {
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
      const tokens = (await tokenRes.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
      };

      if (!tokens.access_token) {
        return res.status(400).json({ error: tokens.error || "token_exchange_failed", details: tokens });
      }

      let profile: { email?: string; name?: string; id?: string } = {};
      try {
        const pRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        profile = (await pRes.json()) as typeof profile;
      } catch {
        /* profile optional */
      }

      const sessionId = randomUUID();
      oauthTokens[sessionId] = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
        email: profile.email,
        name: profile.name,
      };

      // Redirect back to app with session id (frontend can store & call Drive/Classroom proxies)
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      res.redirect(`${appUrl}/?google_session=${sessionId}`);
    } catch (e) {
      console.error(e);
      res.status(500).send("OAuth callback failed");
    }
  });

  app.post("/api/auth/google/refresh", async (req, res) => {
    const { sessionId } = req.body || {};
    const stored = sessionId ? oauthTokens[sessionId] : null;
    if (!stored?.refresh_token) {
      return res.status(401).json({ error: "No refresh token for session" });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: "OAuth client not configured" });
    }
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: stored.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const tokens = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
      if (!tokens.access_token) {
        return res.status(400).json({ error: "refresh_failed", details: tokens });
      }
      stored.access_token = tokens.access_token;
      stored.expires_at = Date.now() + (tokens.expires_in || 3600) * 1000;
      res.json({ access_token: tokens.access_token, expires_in: tokens.expires_in });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "refresh_error" });
    }
  });

  /** Placeholder Drive list — uses stored session if present; otherwise mock */
  app.get("/api/google/drive/files", async (req, res) => {
    const sessionId = req.query.sessionId as string | undefined;
    const stored = sessionId ? oauthTokens[sessionId] : null;
    if (!stored?.access_token) {
      return res.json({
        source: "mock",
        files: [
          { id: "mock1", name: "Study Materials", mimeType: "application/vnd.google-apps.folder" },
          { id: "mock2", name: "Week1-Notes.pdf", mimeType: "application/pdf" },
        ],
      });
    }
    try {
      const q = encodeURIComponent("'root' in parents and trashed=false");
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=20&q=${q}&fields=files(id,name,mimeType)`,
        { headers: { Authorization: `Bearer ${stored.access_token}` } }
      );
      const data = await r.json();
      res.json({ source: "google", ...data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "drive_list_failed" });
    }
  });

  /** Placeholder Classroom courses */
  app.get("/api/google/classroom/courses", async (req, res) => {
    const sessionId = req.query.sessionId as string | undefined;
    const stored = sessionId ? oauthTokens[sessionId] : null;
    if (!stored?.access_token) {
      return res.json({
        source: "mock",
        courses: [{ id: "course_family", name: "Family Classroom", courseState: "ACTIVE" }],
      });
    }
    try {
      const r = await fetch("https://classroom.googleapis.com/v1/courses?pageSize=20",
        { headers: { Authorization: `Bearer ${stored.access_token}` } }
      );
      const data = await r.json();
      res.json({ source: "google", ...data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "classroom_list_failed" });
    }
  });

  // ---------- Vite / static ----------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `Gemini: ${process.env.GEMINI_API_KEY ? "configured" : "missing (demo fallbacks active)"}`
    );
    console.log(
      `Google OAuth: ${
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? "configured"
          : "not configured"
      }`
    );
  });
}

startServer();
