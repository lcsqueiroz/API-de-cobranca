import { Router, type Request, type Response } from 'express';
import Database from 'better-sqlite3';
import { db } from '../db.js';
import { limparCpf, validarCpf } from '../utils/cpf.js';

const router = Router();

// POST /associados
router.post('/', (req: Request, res: Response) => {
  const nome = req.body?.nome;
  const cpf = req.body?.cpf;
  const mensalidade = req.body?.mensalidade;


  if (typeof nome !== 'string' || nome.trim() === '') {
    res.status(400).json({ erro: 'Nome é obrigatório' });
    return;
  }

  
  if (typeof cpf !== 'string' || !validarCpf(cpf)) {
    res.status(400).json({ erro: 'CPF inválido' });
    return;
  }


  if (typeof mensalidade !== 'number' || mensalidade <= 0) {
    res.status(400).json({ erro: 'Mensalidade deve ser um número maior que zero' });
    return;
  }

  const nomeLimpo: string = nome.trim();
  const cpfLimpo: string = limparCpf(cpf);
  const mensalidadeCentavos: number = Math.round(mensalidade * 100);

  try {
    const resultado = db
      .prepare('INSERT INTO associados (nome, cpf, mensalidade_centavos) VALUES (?, ?, ?)')
      .run(nomeLimpo, cpfLimpo, mensalidadeCentavos);

    res.status(201).json({
      id: resultado.lastInsertRowid,
      nome: nomeLimpo,
      cpf: cpfLimpo,
      mensalidade: mensalidadeCentavos / 100,
    });
  } catch (err) {
    // cpf repetido: o UNIQUE do banco recusou
    if (err instanceof Database.SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ erro: 'CPF já cadastrado' });
      return;
    }

    // qualquer outro erro vai para o tratador global (500)
    throw err;
  }
});

export { router as associadosRouter };
