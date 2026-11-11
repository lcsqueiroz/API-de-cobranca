import Database from 'better-sqlite3';

const db = new Database('banco.db');

// no SQLite estrangeiras vem desligadas por padrão
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS associados (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                  TEXT    NOT NULL,
    cpf                   TEXT    NOT NULL UNIQUE,
    mensalidade_centavos  INTEGER NOT NULL,
    criado_em             TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cobrancas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nosso_numero    TEXT    UNIQUE,
    associado_id    INTEGER NOT NULL REFERENCES associados(id),
    mes_referencia  TEXT    NOT NULL,
    valor_centavos  INTEGER NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGA')),
    data_pagamento  TEXT,
    UNIQUE (associado_id, mes_referencia)
  );

  CREATE TABLE IF NOT EXISTS eventos_processados (
    id_evento       TEXT PRIMARY KEY,
    nosso_numero    TEXT NOT NULL,
    data_pagamento  TEXT NOT NULL,
    recebido_em     TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export { db };
