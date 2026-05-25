PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'staff')),
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deactivated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_users_username_normalized_unique
  ON staff_users (username_normalized);

CREATE INDEX IF NOT EXISTS staff_users_username_lookup_idx
  ON staff_users (username_normalized, is_active);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  invalidated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES staff_users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique
  ON sessions (token_hash);

CREATE INDEX IF NOT EXISTS sessions_user_lookup_idx
  ON sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS activated_devices (
  device_id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  activated_by_user_id TEXT NOT NULL,
  activated_at TEXT NOT NULL,
  deactivated_at TEXT,
  deactivated_by_user_id TEXT,
  FOREIGN KEY (activated_by_user_id) REFERENCES staff_users (id),
  FOREIGN KEY (deactivated_by_user_id) REFERENCES staff_users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS activated_devices_single_active_device_idx
  ON activated_devices ((deactivated_at IS NULL))
  WHERE deactivated_at IS NULL;

CREATE INDEX IF NOT EXISTS activated_devices_active_lookup_idx
  ON activated_devices (deactivated_at, activated_at);

CREATE TABLE IF NOT EXISTS authorized_device_users (
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  offline_pin_hash TEXT,
  enrolled_at TEXT,
  PRIMARY KEY (device_id, user_id),
  FOREIGN KEY (device_id) REFERENCES activated_devices (device_id),
  FOREIGN KEY (user_id) REFERENCES staff_users (id)
);

CREATE TABLE IF NOT EXISTS enrollment_profiles (
  id TEXT PRIMARY KEY,
  record_number TEXT,
  child_first_name TEXT NOT NULL,
  child_first_name_normalized TEXT NOT NULL,
  child_middle_name TEXT,
  child_last_name TEXT NOT NULL,
  child_last_name_normalized TEXT NOT NULL,
  child_suffix TEXT,
  birth_date TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('Female', 'Male', 'Not specified')),
  address TEXT NOT NULL,
  guardian_full_name TEXT NOT NULL,
  guardian_relationship TEXT NOT NULL,
  guardian_contact_number TEXT NOT NULL,
  school_year TEXT NOT NULL,
  enrollment_date TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS enrollment_profiles_record_number_unique
  ON enrollment_profiles (record_number)
  WHERE record_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS enrollment_profiles_duplicate_warning_idx
  ON enrollment_profiles (
    child_first_name_normalized,
    child_last_name_normalized,
    birth_date
  );

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  note TEXT,
  recorded_by_user_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES enrollment_profiles (id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES staff_users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_profile_date_unique
  ON attendance_records (profile_id, attendance_date);

CREATE TABLE IF NOT EXISTS sync_operations (
  operation_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id TEXT,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  client_recorded_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (device_id) REFERENCES activated_devices (device_id),
  FOREIGN KEY (user_id) REFERENCES staff_users (id)
);

CREATE INDEX IF NOT EXISTS sync_operations_device_time_idx
  ON sync_operations (device_id, received_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES staff_users (id)
);

CREATE INDEX IF NOT EXISTS audit_events_occurred_at_idx
  ON audit_events (occurred_at DESC);
