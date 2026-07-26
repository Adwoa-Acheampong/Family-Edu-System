import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const conversationHistory: Record<string, any[]> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/suggest-goals", async (req, res) => {
    try {
      const { user } = req.body;
      const prompt = `Based on the following user profile, suggest 3 new daily learning objectives or quests. 
User: ${user.name}
Role: ${user.persona}
Learning Focus: ${user.learningFocus}
Theme: ${user.theme}

Output only a JSON array of objects, where each object has:
- title: A short, catchy title (string)
- desc: A brief description of the objective (string)
- xp: An integer representing XP value (e.g. 100, 200, 300)
- type: A string like "MAIN QUEST" or "SIDE QUEST"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating goals:", error);
      res.status(500).json({ error: "Failed to generate goals" });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message, persona, userName, age, learningFocus, conversationId } = req.body;
      
      let role = "Assistant";
      let goal = "help the user";
      let tone = "helpful";
      let complexity = "simple";

      if (persona === "Architect") {
        role = "Strategic Advisor";
        goal = "provide analytical insights, vet strategic plans, and troubleshoot technical challenges related to Enterprise Architecture";
        tone = "professional, analytical, and concise";
        complexity = "advanced, technical";
      } else if (persona === "Master") {
        role = "Patient Companion";
        goal = "guide her through steps, answer 'how-to' questions, and offer encouraging words";
        tone = "warm, encouraging, and clear";
        complexity = "simple, practical";
      } else if (persona === "Analyst") {
        role = "Tech Mentor";
        goal = "explain coding concepts, provide engaging challenges, and track his progress in quests";
        tone = "enthusiastic, challenging, and supportive";
        complexity = "intermediate, technical";
      } else if (persona === "Explorer") {
        role = "Storyteller";
        goal = "narrate lessons, guide him through interactive games, and make learning an adventure";
        tone = "playful, imaginative, and gentle";
        complexity = "simple, narrative";
      } else if (persona === "Discoverer") {
        role = "Playmate";
        goal = "encourage exploration, celebrate small wins, and make learning fun with sounds and visuals";
        tone = "cheerful, encouraging, and simple";
        complexity = "very simple, direct";
      } else if (persona === "Seedling") {
        role = "Nurturer";
        goal = "play songs, name objects, and provide a comforting presence";
        tone = "soothing, gentle, and very simple";
        complexity = "extremely simple, repetitive";
      }

      const systemPrompt = `You are a ${role} for a ${age}-year-old named ${userName}.\nYour primary goal is to ${goal}.\nMaintain a ${tone} tone and use ${complexity} language.\nCurrent Learning Context: ${learningFocus}.`;

      const convId = conversationId || Date.now().toString();
      if (!conversationHistory[convId]) {
        conversationHistory[convId] = [];
      }

      conversationHistory[convId].push({
        role: 'user',
        parts: [{ text: message }]
      });

      if (conversationHistory[convId].length > 10) {
        conversationHistory[convId] = conversationHistory[convId].slice(-10);
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: conversationHistory[convId],
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const reply = response.text || "I'm not sure how to respond to that.";

      conversationHistory[convId].push({
        role: 'model',
        parts: [{ text: reply }]
      });

      res.json({ response: reply, conversationId: convId });
    } catch (error) {
      console.error("Error in ai-chat:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/submit-assignment", async (req, res) => {
    try {
      const { courseId, courseWorkId, textResponse, fileName } = req.body;
      
      // Mock processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({ status: "submitted", submissionId: `sub_${Date.now()}` });
    } catch (error) {
      console.error("Error in submit-assignment:", error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
