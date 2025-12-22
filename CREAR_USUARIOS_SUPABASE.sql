-- Script SQL para crear usuarios en Supabase
-- Ejecuta esto en Supabase SQL Editor

-- Usuario Admin (admin / admin123)
INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES
('admin', '$2b$10$wTqu/OtJ7V4DYucaCr/2qO1dq3Jezgr//b6NyAgw7Cx5LqOBnSO.y', 'Jefe de Marketing', 'admin', '#8B5CF6')
ON CONFLICT (username) DO NOTHING;

-- Usuario Diseñador (diseñador / diseño123)
INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES
('diseñador', '$2b$10$49UH93ngGWYpSNK/EpPt6OaLq/hGi8DsQeIRKP8fv9L2RR18Ge6fa', 'Diseñador Gráfico', 'designer', '#EC4899')
ON CONFLICT (username) DO NOTHING;

-- Usuario Asistente (asistente / asist123)
INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES
('asistente', '$2b$10$rUN1RTZQaADLL4B591n9s.VAxhCW5mITEEvGfLpWgygtVR1BUjQmC', 'Asistente de Marketing', 'assistant', '#10B981')
ON CONFLICT (username) DO NOTHING;

-- Usuario Audiovisual (audiovisual / audio123)
INSERT INTO users (username, password_hash, full_name, role, avatar_color) VALUES
('audiovisual', '$2b$10$lT/WwIW3SiFsSAkldRxSl.fQSlNe3WV8.f0bvf291JhZ.Lw.vDh1e', 'Especialista Audiovisual', 'audiovisual', '#F59E0B')
ON CONFLICT (username) DO NOTHING;

-- Verificar usuarios creados
SELECT id, username, full_name, role FROM users;
