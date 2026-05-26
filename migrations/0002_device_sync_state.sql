CREATE TABLE IF NOT EXISTS device_sync_state (
  device_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  last_synced_at TEXT,
  FOREIGN KEY (device_id) REFERENCES activated_devices (device_id)
);
