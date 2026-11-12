# Teste Prático AEIG — API de Cobrança

API de cobrança em Node.js + TypeScript: cadastro de associados, geração de cobranças mensais e recebimento do aviso de pagamento do banco (webhook), sem processar o mesmo aviso duas vezes.

**Stack:** Node.js, TypeScript, Express 5 e SQLite (`better-sqlite3`, SQL puro, sem ORM).

## Como rodar o projeto

### Requisitos

- **Node.js 22.9 ou superior** (testado na 24). O projeto usa a leitura nativa de `.env` do Node.
- npm.

Não é preciso instalar nenhum banco de dados. O SQLite é um arquivo (`banco.db`), criado automaticamente na primeira execução.

### Passo a passo

```bash
# 1. clonar e entrar na pasta
git clone https://github.com/lcsqueiroz/teste-pratico-AEIG.git
cd teste-pratico-AEIG

# 2. instalar as dependências
npm install

# 3. (opcional) criar o .env a partir do exemplo. Sem ele, a API usa a porta 3000
cp .env.example .env

# 4. subir em modo desenvolvimento (reinicia ao salvar arquivos)
npm run dev
```

A API sobe em `http://localhost:3000`. Para conferir se ela está no ar:

```bash
curl http://localhost:3000/health
```

### Build de produção

```bash
npm run build   # compila o TypeScript para a pasta dist/
npm start       # roda o JavaScript compilado com o node
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP da API |

### Recomeçar com o banco vazio

Apague o arquivo `banco.db` e suba o servidor de novo. As tabelas são recriadas automaticamente.

<!-- principais decisões, o que ficou faltando e uso de IA entram no bloco 10 -->

## Exemplos de chamadas da API (Insomnia)

As chamadas estão no arquivo `insomnia.json`, na raiz do projeto.

1. Suba o servidor com `npm run dev`. A API fica em `http://localhost:3000`.
2. No Insomnia, vá em **Import → From File** e selecione o `insomnia.json`.
3. A coleção **AEIG - API de Cobrança** aparece organizada em pastas:
   - **0 - Health**
   - **1 - Associados**: cadastrar, CPF repetido, CPF inválido
   - **2 - Cobranças**: gerar, mês repetido, mês inválido, associado inexistente, consultar, cobrança inexistente
4. O nome de cada chamada traz o status HTTP esperado, por exemplo `Cadastrar associado (201)`.
5. A aba **Docs** de cada chamada mostra a resposta esperada (status e JSON), gerada a partir de uma execução real com o banco vazio.

Todas as chamadas usam a variável de ambiente `base_url`. Se mudar a porta no `.env`, ajuste a variável no Insomnia.

> Para reproduzir os exemplos do zero, apague o `banco.db` antes de subir o servidor. Assim o primeiro associado recebe o `id` 1 e a primeira cobrança recebe o nosso número `00000001`.
