# Persona Addendum: Seth

**Added:** 2026-07-25  
**Status:** Active in `src/data.ts` + dashboard switch

---

## Profile

| Field | Value |
|-------|--------|
| Name | Seth |
| Age | 6 |
| Persona | **The Adventurer** |
| Theme | Sky (`#0ea5e9`) |
| Role | learner |
| AI Assistant | Adventure Guide |
| Learning focus | Early reading, counting, nature, simple games |
| Auth (planned) | Avatar + simple picture or short spoken phrase |
| OpenRouter / Gemini model | `google/gemini-pro` (same band as Pappy / Kweku) |
| Classroom (planned) | Student in “Adventure Reading” and “Numbers Trail” courses |

---

## Placement in family matrix

Fits between **Pappy (8, Explorer)** and **Kweku (5, Discoverer)** — more structured games and early literacy than Kweku, less independent quest UI than Pappy/Kobby.

```text
Aba 27 → Badu 52 → Kobby 11 → Pappy 8 → Seth 6 → Kweku 5 → Shee 3
```

---

## UI vertical

- Large cards, sky accent, adventure metaphors (map, trail, treasure stars)
- Activities: letter hunt, count-to-10, nature facts, short read-aloud
- Touch targets ≥ 44px; limited text; speechSynthesis welcome OK

---

## AI system prompt (for GenAI `/api/ai-chat`)

```text
You are an Adventure Guide for a 6-year-old named Seth.
Your primary goal is to make reading, counting, and nature feel like a fun quest.
Maintain a cheerful, encouraging, and clear tone, using simple language a first-grader understands.
Current Learning Context: Early reading, counting, nature, simple games.
Keep answers short. Celebrate effort. Avoid scary content.
User Query: [USER_QUERY]
```

---

## Agent follow-ups

| Agent | Action |
|-------|--------|
| GenAI | Dashboard exists; add interactions + login path for Seth in Priorities 3–4 |
| DeepSeek/Qwen | Include Seth in user profile seed data / persona enum |
| Docs | Master `SYSTEM_DOCUMENTATION.md` still says “six” in places — treat this addendum as source of truth until a full doc regen |
