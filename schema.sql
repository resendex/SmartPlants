SET search_path TO bd044_schema, public;

-- Plataforma de Streaming de Música - Esquema relacional PostgreSQL
-- Entrega 2: Criação da Base de Dados, Constraints, Triggers e Views
-- Grupo 44: Afonso Ferreira (64117) , José Miguel Resende (62513), Tomás Farinha (64253)

-- ========================
-- LIMPEZA (Drop de objetos existentes)
-- ========================

-- Dropar tabelas caso existam (ordem inversa das dependências)
DROP TABLE IF EXISTS playlist_audit CASCADE;
DROP TABLE IF EXISTS user_tracks_stats CASCADE;
DROP TABLE IF EXISTS play_history CASCADE;
DROP TABLE IF EXISTS favourites CASCADE;
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS author_track CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Dropar functions e procedures
DROP FUNCTION IF EXISTS update_user_track_stats() CASCADE;
DROP FUNCTION IF EXISTS log_playlist_changes() CASCADE;
DROP FUNCTION IF EXISTS check_subscription_dates() CASCADE;
DROP FUNCTION IF EXISTS create_playlist(INT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS top_tracks() CASCADE;
DROP FUNCTION IF EXISTS total_revenue() CASCADE;
DROP PROCEDURE IF EXISTS delete_playlist(INT) CASCADE;
DROP FUNCTION IF EXISTS active_subscriptions() CASCADE;

-- Dropar tipos ENUM
DROP TYPE IF EXISTS genre_enum CASCADE;
DROP TYPE IF EXISTS plan_type_enum CASCADE;

-- ==========================================================
-- schema.sql
-- ==========================================================

-- ========================
-- Tipos ENUM
-- ========================
CREATE TYPE genre_enum AS ENUM ('Pop', 'Rock', 'Rap', 'Soul', 'Jazz', 'Electronic');
CREATE TYPE plan_type_enum AS ENUM ('Free', 'Premium', 'Family');

-- ========================
-- Tabelas principais
-- ========================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_plans (
    plan_id SERIAL PRIMARY KEY,
    plan_name plan_type_enum UNIQUE NOT NULL,
    monthly_price NUMERIC(6,2) CHECK (monthly_price >= 0),
    max_devices INT CHECK (max_devices > 0)
);

CREATE TABLE user_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id INT REFERENCES subscription_plans(plan_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    plan_id INT REFERENCES subscription_plans(plan_id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(6,2) CHECK (amount >= 0)
);

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    birth_date DATE
);

CREATE TABLE albums (
    album_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    release_year INT CHECK (release_year >= 1900),
    genre genre_enum,
    author_id INT REFERENCES authors(author_id)
);

CREATE TABLE tracks (
    track_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    duration_secs INT CHECK (duration_secs > 0),
    release_date DATE,
    album_id INT REFERENCES albums(album_id),
    genre genre_enum
);

CREATE TABLE author_track (
    author_id INT REFERENCES authors(author_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    PRIMARY KEY (author_id, track_id)
);

CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_tracks (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE favourites (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    track_id INT REFERENCES tracks(track_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE play_history (
    play_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    track_id INT REFERENCES tracks(track_id),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_listened INT CHECK (duration_listened > 0)
);

CREATE TABLE user_tracks_stats (
    user_id INT REFERENCES users(user_id),
    track_id INT REFERENCES tracks(track_id),
    total_plays INT DEFAULT 0,
    last_played TIMESTAMP,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE playlist_audit (
    audit_id SERIAL PRIMARY KEY,
    playlist_id INT,
    action VARCHAR(50),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- Triggers
-- ========================

-- Atualiza estatísticas de reprodução
CREATE OR REPLACE FUNCTION update_user_track_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_tracks_stats (user_id, track_id, total_plays, last_played)
    VALUES (NEW.user_id, NEW.track_id, 1, NOW())
    ON CONFLICT (user_id, track_id)
    DO UPDATE SET
        total_plays = user_tracks_stats.total_plays + 1,
        last_played = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_track_stats
AFTER INSERT ON play_history
FOR EACH ROW EXECUTE FUNCTION update_user_track_stats();

-- Auditoria de playlists
CREATE OR REPLACE FUNCTION log_playlist_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO playlist_audit (playlist_id, action)
    VALUES (NEW.playlist_id, TG_OP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_playlist_insert
AFTER INSERT ON playlists
FOR EACH ROW EXECUTE FUNCTION log_playlist_changes();

-- Verifica validade da subscrição
CREATE OR REPLACE FUNCTION check_subscription_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_subscription_dates
BEFORE INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION check_subscription_dates();

-- ========================
-- Views
-- ========================

-- Estado da Subscrição
CREATE VIEW v_user_subscription_status AS
SELECT u.username, u.email, sp.plan_name, 
       us.start_date, us.end_date, us.active
FROM users u
LEFT JOIN user_subscriptions us USING(user_id)
LEFT JOIN subscription_plans sp USING(plan_id);

-- Popularidade
CREATE VIEW v_track_popularity AS
SELECT t.track_id, t.title, t.genre,
       COALESCE(SUM(uts.total_plays), 0) as total_plays
FROM tracks t
LEFT JOIN user_tracks_stats uts USING(track_id)
GROUP BY t.track_id, t.title, t.genre;

-- Receita Mensal
CREATE VIEW v_monthly_revenue AS
SELECT DATE_TRUNC('month', payment_date) as month,
       COUNT(*) as num_payments,
       SUM(amount) as total_revenue
FROM payments
GROUP BY DATE_TRUNC('month', payment_date);