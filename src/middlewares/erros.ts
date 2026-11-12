import type { NextFunction, Request, Response } from 'express';

// rota não encontrada: nenhuma rota registrada antes respondeu
export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

export function tratarErros(
  err: Error & { type?: string },
  req: Request,
  res: Response,
  next: NextFunction,
) {

  // JSON mal formado 
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
