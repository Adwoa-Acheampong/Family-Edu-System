/**
 * File-backed persistence for system settings + event log.
 * Survives server restarts without native SQLite bindings (Windows-friendly).
 */
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_PATH = path.join(DATA_DIR, "system-settings.json");
const EVENTS_PATH = path.join(DATA_DIR, "system-events.json");

export type SystemSettings = {
  pollIntervalMs: number;
  engineRoomUrl: string;
  classroomCourseId: string;
  enableNotifications: boolean;
};

export type SystemEvent = { time: string; event: string; status: string };

const defaults: SystemSettings = {
  pollIntervalMs: 15000,
  engineRoomUrl: process.env.VITE_ENGINE_ROOM_URL || "",
  classroomCourseId: "",
  enableNotifications: true,
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

let settingsCache: SystemSettings = readJson(SETTINGS_PATH, defaults);
let eventsCache: SystemEvent[] = readJson(EVENTS_PATH, [] as SystemEvent[]);

if (!Array.isArray(eventsCache)) eventsCache = [];

export function getSettings(): SystemSettings {
  return { ...settingsCache };
}

export function saveSettings(partial: Partial<SystemSettings>): SystemSettings {
  settingsCache = {
    ...settingsCache,
    ...partial,
    pollIntervalMs:
      typeof partial.pollIntervalMs === "number" && partial.pollIntervalMs >= 5000
        ? partial.pollIntervalMs
        : settingsCache.pollIntervalMs,
  };
  writeJson(SETTINGS_PATH, settingsCache);
  return getSettings();
}

export function getEvents(limit = 12): SystemEvent[] {
  return eventsCache.slice(0, limit);
}

export function pushEvent(event: string, status: string = "INFO") {
  eventsCache.unshift({
    time: new Date().toISOString().slice(11, 19),
    event,
    status,
  });
  if (eventsCache.length > 80) eventsCache = eventsCache.slice(0, 80);
  try {
    writeJson(EVENTS_PATH, eventsCache);
  } catch {
    /* disk full / readonly — keep in memory */
  }
}
