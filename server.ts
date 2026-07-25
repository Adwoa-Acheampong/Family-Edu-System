import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
