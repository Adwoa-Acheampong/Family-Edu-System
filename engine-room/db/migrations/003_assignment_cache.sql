-- Optional local cache of Classroom assignments for offline/analytics

CREATE TABLE IF NOT EXISTS assignment_cache (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    course_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    points INTEGER,
    payload_json TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_cache_user_status
    ON assignment_cache(user_id, status);
