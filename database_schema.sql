-- Plataforma de Streaming de Música - Esquema relacional PostgreSQL
-- Entrega 2: Criação da Base de Dados, Constraints e Triggers
-- Grupo 44: Afonso Ferreira, José Miguel Resende, Tomás Farinha

-- Criação da Base de Dados (fora da transação)
CREATE DATABASE music_platform;

-- Conectar à database (este comando deve ser executado manualmente no psql)
-- \c music_platform;

-- Agora executar o resto do script dentro da database music_platform

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

-- ==========================================================
-- >>> data.sql
-- ==========================================================

-- Planos de subscrição
INSERT INTO subscription_plans (plan_name, monthly_price, max_devices)
VALUES
('Free', 0.00, 1),
('Premium', 9.99, 3),
('Family', 14.99, 6);

-- 150 utilizadores
INSERT INTO users (username, full_name, email, password_hash)
SELECT
  'user' || i,
  'User ' || i,
  'user' || i || '@example.com',
  md5('pass' || i)
FROM generate_series(1, 150) i;

-- 40 autores
INSERT INTO authors (name, country, birth_date)
SELECT
  'Author ' || i,
  (ARRAY['Portugal','USA','UK','Brazil','France','Spain'])[ (1 + (random()*5))::int ],
  (DATE '1950-01-01' + (random() * 20000)::int)
FROM generate_series(1, 40) i;

-- 80 álbuns
INSERT INTO albums (title, release_year, genre, author_id)
SELECT
  'Album ' || i,
  (1980 + (random()*40)::int),
  (ARRAY['Pop','Rock','Rap','Soul','Jazz','Electronic'])[ (1 + (random()*5))::int ]::genre_enum,
  ((i % 40) + 1)
FROM generate_series(1, 80) i;

-- 400 faixas
INSERT INTO tracks (title, duration_secs, release_date, album_id, genre)
SELECT
  'Track ' || i,
  (60 + (random() * 300))::int,
  (DATE '2000-01-01' + (random() * 7000)::int),
  ((i % 80) + 1),
  (ARRAY['Pop','Rock','Rap','Soul','Jazz','Electronic'])[ (1 + (random()*5))::int ]::genre_enum
FROM generate_series(1, 400) i;

-- Relação autor-track
INSERT INTO author_track (author_id, track_id)
SELECT ((i % 40) + 1), i FROM generate_series(1, 400) i;

-- 150 playlists
INSERT INTO playlists (user_id, name)
SELECT ((i % 150) + 1), 'Playlist ' || i
FROM generate_series(1, 150) i;

-- 300 entradas em playlist_tracks
INSERT INTO playlist_tracks (playlist_id, track_id)
SELECT ((random() * 149)::int + 1), ((random() * 399)::int + 1)
FROM generate_series(1, 300) i;

-- 300 favoritos
INSERT INTO favourites (user_id, track_id)
SELECT ((random() * 149)::int + 1), ((random() * 399)::int + 1)
FROM generate_series(1, 300) i;

-- 600 reproduções (gera estatísticas via trigger)
INSERT INTO play_history (user_id, track_id, duration_listened)
SELECT
  ((random() * 149)::int + 1),
  ((random() * 399)::int + 1),
  (30 + (random() * 300))::int
FROM generate_series(1, 600) i;

-- Pagamentos
INSERT INTO payments (user_id, plan_id, amount)
SELECT ((random()*149)::int + 1), ((random()*2)::int + 1), (5 + (random()*10))::numeric(6,2)
FROM generate_series(1, 200) i;

-- Subscrições
INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date)
SELECT
  ((random() * 149)::int + 1),
  ((random() * 2)::int + 1),
  (DATE '2023-01-01' + (random() * 200)::int),
  (DATE '2024-01-01' + (random() * 200)::int)
FROM generate_series(1, 150) i;

-- ==========================================================
-- >>> procedures.sql
-- ==========================================================

-- Procedure: criar playlist
CREATE OR REPLACE FUNCTION create_playlist(p_user INT, p_name TEXT)
RETURNS INT AS $$
DECLARE
    new_playlist_id INT;
BEGIN
    INSERT INTO playlists (user_id, name) VALUES (p_user, p_name)
    RETURNING playlist_id INTO new_playlist_id;
    RETURN new_playlist_id;
END;
$$ LANGUAGE plpgsql;

-- Function: top 5 faixas mais reproduzidas
CREATE OR REPLACE FUNCTION top_tracks()
RETURNS TABLE(track_id INT, plays INT) AS $$
BEGIN
    RETURN QUERY
    SELECT track_id, SUM(total_plays) AS plays
    FROM user_tracks_stats
    GROUP BY track_id
    ORDER BY plays DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function: receita total
CREATE OR REPLACE FUNCTION total_revenue()
RETURNS NUMERIC AS $$
DECLARE total NUMERIC;
BEGIN
    SELECT SUM(amount) INTO total FROM payments;
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- Procedure: apagar playlist (com log)
CREATE OR REPLACE PROCEDURE delete_playlist(p_playlist INT)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM playlist_tracks WHERE playlist_id = p_playlist;
    DELETE FROM playlists WHERE playlist_id = p_playlist;
    INSERT INTO playlist_audit (playlist_id, action) VALUES (p_playlist, 'DELETED');
END;
$$;

-- Function: subscrições ativas
CREATE OR REPLACE FUNCTION active_subscriptions()
RETURNS TABLE(user_id INT, plan_name plan_type_enum, active BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT u.user_id, sp.plan_name, us.active
    FROM user_subscriptions us
    JOIN users u USING(user_id)
    JOIN subscription_plans sp USING(plan_id)
    WHERE us.active = TRUE;
END;
$$ LANGUAGE plpgsql;