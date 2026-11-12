import { Router, type Request, type Response } from 'express';
import Database from 'better-sqlite3';
import { db } from '../db.js';

const router = Router();

// busca uma cobrança no valor em reais
function buscarCobranca(nossoNumero: string) {
  return db
    .prepare(
      `SELECT nosso_numero, associado_id, mes_referencia,
              valor_centavos / 100.0 AS valor, status, data_pagamento
       FROM cobrancas
       WHERE nosso_numero = ?`,
    )
    .get(nossoNumero);
}

// POST /cobrancas
router.post('/', (req: Request, res: Response) => {
  const associadoId = req.body?.associado_id;
  const mesReferencia = req.body?.mes_referencia;

  // valida o associado_id
  if (!Number.isInteger(associadoId)) {
    res.status(400).json({ erro: 'associado_id deve ser um número inteiro' });
    return;
  }

  // regex AAAA-MM, com mês de 01 a 12
  if (typeof mesReferencia !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mesReferencia)) {
    res.status(400).json({ erro: 'mes_referencia deve estar no formato AAAA-MM' });
    return;
  }

  // busca o associado para pegar a mensalidade
  const associado = db
    .prepare('SELECT mensalidade_centavos FROM associados WHERE id = ?')
    .get(associadoId) as { mensalidade_centavos: number } | undefined;

  if (!associado) {
    res.status(404).json({ erro: 'Associado não encontrado' });
    return;
  }

  // INSERT e UPDATE na mesma transação
  const criarCobranca = db.transaction(() => {
    const resultado = db
      .prepare('INSERT INTO cobrancas (associado_id, mes_referencia, valor_centavos) VALUES (?, ?, ?)')
      .run(associadoId, mesReferencia, associado.mensalidade_centavos);

    // id com zeros à esquerda
    const nossoNumero: string = String(resultado.lastInsertRowid).padStart(8, '0');

    db.prepare('UPDATE cobrancas SET nosso_numero = ? WHERE id = ?').run(nossoNumero, resultado.lastInsertRowid);

    return nossoNumero;
  });

  try {
    const nossoNumero: string = criarCobranca();
    res.status(201).json(buscarCobranca(nossoNumero));
  } catch (err) {
    // mais de uma cobraça no mês o UNIQUE do banco recusa
    if (err instanceof Database.SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ erro: 'Já existe cobrança deste associado neste mês' });
      return;
    }

    // qualquer outro erro (500)
    throw err;
  }
});

// GET /cobrancas/:nosso_numero
router.get('/:nosso_numero', (req: Request, res: Response) => {
  const cobranca = buscarCobranca(String(req.params.nosso_numero));

  if (!cobranca) {
    res.status(404).json({ erro: 'Cobrança não encontrada' });
    return;
  }

  res.status(200).json(cobranca);
});

export { router as cobrancasRouter };
