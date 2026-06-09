-- Skip migrations whose schema already exists on remote (github_integrations from 0005).
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0007_tan_timeslip.sql');
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0007_yielding_molly_hayes.sql');
