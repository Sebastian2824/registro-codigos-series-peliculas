-- Migration number: 0001 	 2025-11-04T07:01:04.881Z
CREATE TABLE IF NOT EXISTS animes_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombreSerie TEXT NOT NULL,
  temporada TEXT NOT NULL,
  idioma TEXT NOT NULL,
  servidor TEXT NOT NULL,
  episodio TEXT NOT NULL,
  iframe TEXT,                     -- guarda el código iframe (HTML) o el link embebido
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas frecuentes por serie/temporada/idioma/servidor
CREATE INDEX IF NOT EXISTS idx_episodios_serie_temporada ON animes_series (nombreSerie, temporada);
CREATE INDEX IF NOT EXISTS idx_episodios_idioma_servidor ON animes_series (idioma, servidor);
