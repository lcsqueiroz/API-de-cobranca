import { Router, type Request, type Response } from 'express';
import { db } from '../db.js';

const router = Router();

// POST /webhooks/pagamento
router.post('/pagamento', (req: Request, res: Response) => {
  const idEvento = req.body?.id_evento;
  const nossoNumero = req.body?.nosso_numero;
  const dataPagamento = req.body?.data_pagamento;

  // valida o id_evento
  if (typeof idEvento !== 'string' || idEvento.trim() === '') {
    res.status(400).json({ erro: 'id_evento é obrigatório' });
    return;
  }

  // valida o nosso_numero
  if (typeof nossoNumero !== 'string' || nossoNumero.trim() === '') {
    res.status(400).json({ erro: 'nosso_numero é obrigatório' });
    return;
  }

  // valida a data AAAA-MM-DD
  if (typeof dataPagamento !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dataPagamento)) {
    res.status(400).json({ erro: 'data_pagamento deve estar no formato AAAA-MM-DD' });
    return;
  }

  // unica transação
  const processarPagamento = db.transaction(() => {
    // Verifica se cobrança existe
    const cobranca = db
      .prepare('SELECT id, status FROM cobrancas WHERE nosso_numero = ?')
      .get(nossoNumero) as { id: number; status: string } | undefined;

    if (!cobranca) {
      return { status: 404, corpo: { erro: 'Cobrança não encontrada' } };
    }

    //se o id_evento já existe, o banco ignora
    const evento = db
      .prepare(
        `INSERT INTO eventos_processados (id_evento, nosso_numero, data_pagamento)
         VALUES (?, ?, ?)
         ON CONFLICT (id_evento) DO NOTHING`,
      )
      .run(idEvento, nossoNumero, dataPagamento);

    if (evento.changes === 0) {
      return { status: 200, corpo: { mensagem: 'Evento já processado' } };
    }

    // evento para uma cobrança que já estava paga
    if (cobranca.status === 'PAGA') {
      return { status: 200, corpo: { mensagem: 'Cobrança já estava paga' } };
    }

    // Update no banco
    db.prepare("UPDATE cobrancas SET status = 'PAGA', data_pagamento = ? WHERE id = ?").run(
      dataPagamento,
      cobranca.id,
    );

    return { status: 200, corpo: { mensagem: 'Pagamento registrado' } };
  });

  const resultado = processarPagamento();
  res.status(resultado.status).json(resultado.corpo);
});

export { router as webhooksRouter };
