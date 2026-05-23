CREATE TABLE IF NOT EXISTS conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cenote_slug TEXT NOT NULL,
  visibility_m INTEGER,
  crowd_level TEXT NOT NULL CHECK(crowd_level IN ('low','medium','high')),
  water_clarity TEXT CHECK(water_clarity IN ('clear','cloudy')),
  notes TEXT,
  contributor_name TEXT,
  reported_at INTEGER NOT NULL,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_cenote_recent
  ON conditions(cenote_slug, reported_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
