SET search_path TO bd044_schema, public;

-- Plataforma de Streaming de Música - Procedures
-- Entrega 2: Criação de Funções e Procedures
-- Grupo 44: Afonso Ferreira (64117) , José Miguel Resende (62513), Tomás Farinha (64253)

-- ==========================================================
-- procedures.sql
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
RETURNS TABLE(track_id INT, plays BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT uts.track_id, SUM(uts.total_plays)::BIGINT AS plays
    FROM user_tracks_stats uts
    GROUP BY uts.track_id
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