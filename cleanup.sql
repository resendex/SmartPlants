-- Script para limpar/resetar a database music_platform
-- Execute este arquivo ANTES de rodar o schema principal

-- Conectar à database music_platform
-- psql -U zemresende -d music_platform -f cleanup.sql

-- Dropar tabelas (ordem inversa das dependências)
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

-- Mensagem de confirmação
SELECT 'Database limpa com sucesso! Agora pode executar o music_platform_schema.sql' AS status;
