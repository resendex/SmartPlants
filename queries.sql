SET search_path TO bd044_schema, public;

-- Plataforma de Streaming de Música - Queries
-- Entrega 2: Consultas à Base de Dados
-- Grupo 44: Afonso Ferreira (64117) , José Miguel Resende (62513), Tomás Farinha (64253)

-- Queries de exemplo para testar a database
-- Executar DEPOIS de criar o schema

-- ==========================================================
-- queries.sql
-- ==========================================================

-- 1. Utilizadores com subscrição ativa
SELECT u.username, sp.plan_name
FROM user_subscriptions us
JOIN users u USING(user_id)
JOIN subscription_plans sp USING(plan_id)
WHERE us.active = TRUE;

-- 2. Top 10 faixas mais reproduzidas
SELECT t.title, SUM(uts.total_plays) AS plays
FROM user_tracks_stats uts
JOIN tracks t USING(track_id)
GROUP BY t.title
ORDER BY plays DESC
LIMIT 10;

-- 3. Faixas por género
SELECT genre, COUNT(*) AS total FROM tracks GROUP BY genre;

-- 4. Receita total
SELECT total_revenue();

-- 5. Playlists com mais de 10 faixas
SELECT p.name, COUNT(pt.track_id) AS total_tracks
FROM playlists p
JOIN playlist_tracks pt USING(playlist_id)
GROUP BY p.name
HAVING COUNT(pt.track_id) > 10;

-- 6. Utilizadores com mais playlists
SELECT u.username, COUNT(p.playlist_id) AS playlists
FROM users u
LEFT JOIN playlists p USING(user_id)
GROUP BY u.username
ORDER BY playlists DESC
LIMIT 5;

-- 7. Função: top_tracks()
SELECT * FROM top_tracks();

-- 8. Álbuns e autores
SELECT a.title AS album, au.name AS author
FROM albums a
JOIN authors au USING(author_id);

-- 9. Reproduções por utilizador
SELECT u.username, SUM(uts.total_plays) AS total
FROM user_tracks_stats uts
JOIN users u USING(user_id)
GROUP BY u.username
ORDER BY total DESC;

-- 10. Duração média de faixas por género
SELECT genre, AVG(duration_secs)::int AS avg_duration FROM tracks GROUP BY genre;

-- 11. Subscrições ativas
SELECT * FROM active_subscriptions();

-- 12. Faixas favoritas por utilizador
SELECT u.username, COUNT(f.track_id) AS total_fav
FROM users u
LEFT JOIN favourites f USING(user_id)
GROUP BY u.username;

-- 13. Autores por país
SELECT country, COUNT(*) AS total FROM authors GROUP BY country;

-- 14. Faixas por álbum
SELECT a.title, COUNT(t.track_id)
FROM albums a
LEFT JOIN tracks t USING(album_id)
GROUP BY a.title;

-- 15. Auditoria de playlists
SELECT * FROM playlist_audit ORDER BY action_time DESC;

-- 16. Utilizador com mais reproduções
SELECT u.username, SUM(uts.total_plays) AS plays
FROM user_tracks_stats uts
JOIN users u USING(user_id)
GROUP BY u.username
ORDER BY plays DESC LIMIT 1;

-- 17. Receita média por utilizador
SELECT AVG(total) FROM (SELECT user_id, SUM(amount) AS total FROM payments GROUP BY user_id) s;

-- 18. Álbuns por década
SELECT (release_year/10)*10 AS decade, COUNT(*) FROM albums GROUP BY decade ORDER BY decade;

-- 19. Subscrições expiradas
SELECT user_id, plan_id FROM user_subscriptions WHERE end_date < NOW();

-- 20. Playlists recentes
SELECT name, created_at FROM playlists ORDER BY created_at DESC LIMIT 10;
