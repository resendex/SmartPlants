SET search_path TO bd044_schema, public;

-- Plataforma de Streaming de Música - Dados
-- Entrega 2: Inserção de Dados na Base de Dados Criada
-- Grupo 44: Afonso Ferreira (64117) , José Miguel Resende (62513), Tomás Farinha (64253)

-- ==========================================================
-- data.sql
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
FROM generate_series(1, 300) i
ON CONFLICT DO NOTHING;

-- 300 favoritos
INSERT INTO favourites (user_id, track_id)
SELECT ((random() * 149)::int + 1), ((random() * 399)::int + 1)
FROM generate_series(1, 300) i
ON CONFLICT DO NOTHING;

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