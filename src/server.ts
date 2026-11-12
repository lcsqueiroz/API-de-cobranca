import express, { type Request, type Response } from 'express';
import { db } from './db.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'Online',
    timestamp: new Date().toISOString(),
  });
});

app.use(rotaNaoEncontrada);
app.use(tratarErros);

app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
