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

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/health` | Confere se a API está no ar |
| `POST` | `/associados` | Cadastra associado (`nome`, `cpf`, `mensalidade`) |
| `POST` | `/cobrancas` | Gera a cobrança do mês (`associado_id`, `mes_referencia` no formato `AAAA-MM`) |
| `GET` | `/cobrancas/:nosso_numero` | Consulta uma cobrança |
| `POST` | `/webhooks/pagamento` | Recebe o aviso de pagamento do banco |

Erros sempre voltam no formato `{ "erro": "mensagem" }`: `400` dado inválido, `404` não encontrado, `409` duplicado, `500` erro inesperado.

A Parte B (correção da função de valor atualizado) está no [`BUGS.md`](BUGS.md).

## Diagramas

Antes de escrever o código, desenhei o fluxo da API e do webhook no Excalidraw. Os arquivos estão na pasta [`diagramas/`](diagramas):

- [`api.excalidraw`](diagramas/api.excalidraw): visão geral: cliente, Express, rotas, validação de CPF, banco e as tabelas do SQLite.
- [`webhook.excalidraw`](diagramas/webhook.excalidraw): o fluxo de decisão do aviso de pagamento, passo a passo, até cada resposta HTTP.

Para abrir, acesse [excalidraw.com](https://excalidraw.com), clique no menu (☰) → **Open** e selecione o arquivo.

## Principais decisões

**Estrutura simples, separada por responsabilidade.** `routes/` para as rotas, `utils/` para a validação de CPF, `middlewares/` para o tratamento de erros e `db.ts` para o banco. Não utilizei controllers e services pois dado o escopo do teste seria esforço desnecessário.

**SQLite com SQL puro.** Roda sem instalar nada e tem o que eu preciso para criar as regras de negócio / webhook `UNIQUE`, chave estrangeira e transação. Usei o `better-sqlite3` (síncrono). O código fica fácil e a transação fica simples. Como o banco é um arquivo local, cada query leva microssegundos. Todas as queries usam parâmetros (`?`), o que evita SQL injection.

**As regras de duplicidade ficam no banco.** CPF único, uma cobrança por associado por mês e evento processado uma vez só são constraints (`UNIQUE` / `PRIMARY KEY`). Eu não consulto antes para ver se existe: tento gravar e, se o banco recusar, respondo `409`. Consultar antes deixaria uma janela para duas requisições iguais passarem juntas.

**Dinheiro em centavos.** A mensalidade é guardada como inteiro (`18990` em vez de `189.90`), porque ponto flutuante não representa decimais com exatidão (`0.1 + 0.2 = 0.30000000000000004`). A API recebe e devolve em reais; por dentro é tudo em centavos.

**CPF guardado só com dígitos.** `529.982.247-25` e `52998224725` são o mesmo CPF para o `UNIQUE`. Além dos dígitos verificadores, rejeito CPFs com todos os dígitos iguais (`111.111.111-11`), que passam no cálculo mas não são válidos.

**Nosso número sequencial com 8 dígitos.** É o `id` da cobrança com zeros à esquerda (`00000001`), no mesmo formato do exemplo do enunciado. Como o `id` só existe depois do `INSERT`, o `INSERT` e o `UPDATE` do nosso número acontecem na mesma transação.

**Webhook idempotente pelo `id_evento`.** O `id_evento` é a `PRIMARY KEY` da tabela `eventos_processados` e é gravado com `INSERT ... ON CONFLICT (id_evento) DO NOTHING`. Se nada foi inserido (`changes = 0`), o aviso é repetido e não tem efeito. Registrar o evento e marcar a cobrança como `PAGA` ficam na mesma transação pois se algo falhar, tudo é desfeito e o reenvio do banco processa de novo. Usei `ON CONFLICT (id_evento)` em vez de `INSERT OR IGNORE` porque o `OR IGNORE` ignoraria qualquer erro de constraint, e um bug passaria em silêncio.

## O que ficou faltando

- **Assinatura HMAC-SHA256 no webhook (bônus).** Compreendo o fundamento mas como é algo que não utilizo com frequência eu iria gastar um bom tempo relembrando o conceito. Devido ao tempo disposto, eu obtei por não fazer o bônus uma vez que eu não teria tanta confiança no código. E não gostaria de gerar um código que eu não soubesse explicar.

- **Testes automatizados (bônus).** Eu fiz os testes pelo Insomnia mas não criei nenhum teste automatizado devido ao tempo que eu iria dispor para esse bônus, poderia gerar através do claude mas isso entra na mesma questão anterior, não me sinto seguro em utilizar um código que não tenho como explicar. Neste caso, me faltaria tempo para validá-lo e verificar se não está passando nenhum bug silecioso.

- **Validação de datas.** O `data_pagamento` do webhook valida mês (01 a 12) e dia (01 a 31), mas não a quantidade de dias de cada mês (`2026-02-31` passa).
- **Valor pago no webhook.** O aviso do enunciado não traz o valor, então não confiro se o valor pago bate com o da cobrança.
- **Listagem e edição.** Não há rotas para listar ou editar associados e cobranças, porque o enunciado não pede.

## Onde usei IA

Usei o **Claude (Claude Code)** durante o projeto e o Gemini nas pesquisas do Google. Os pontos principais:

- **Entender o problema em partes pequenas.** Antes de escrever código, usei o Claude para quebrar o teste em blocos menores. Comecei a desenhar no Excalidraw o fluxo da API e do webhook, e o Claude foi ajustando alguns pontos do desenho.
- **Cálculo do CPF.** Eu não sabia como os dígitos verificadores eram calculados. Pesquisei no google o conceito e a IA integrada explicou como é feito o cálculo. A partir daí criei o algoritmo.
- **Comportamento dos decimais no JavaScript.** Estava com problemas relacionados aos cálculos e aprendi que ponto flutuante não representa decimais com exatidão (`0.1 + 0.2 = 0.30000000000000004`), este foi um dos motivos de eu processar os valores em centavos.
- **Regras no banco.** Minha ideia original era deixar a segurança no banco de dados, mas eu não lembrava de cabeça as regras como `ON CONFLICT`. Usei isso principalmente no webhook, onde a segurança acontece na transação, o evento só é registrado e a cobrança só vira `PAGA` se tudo der certo. A escolha de `ON CONFLICT (id_evento)` em vez de `INSERT OR IGNORE` foi encontrada em pesquisa do Google.
- **Por que não fazer `SELECT` antes de inserir.** Discutimos isso na criação do associado, e aprendi que consultar antes deixa uma janela para duas requisições iguais passarem juntas. Por isso deixo o `UNIQUE` do banco recusar o duplicado.
- **Erro do SQLite no TypeScript.** Aprendi que, no `catch`, o TypeScript só permite acessar o código do erro (`err.code`) depois de confirmar o tipo com `err instanceof Database.SqliteError`.
- **Expressões regulares (regex).** Usei o Claude para montar as regex de validação: o mês de referência (`AAAA-MM`), a data de pagamento do webhook (`AAAA-MM-DD`, com mês de 01 a 12 e dia de 01 a 31) e a de CPF com todos os dígitos iguais.
- **Documentação.** Usei o Claude para estruturar os tópicos da documentação, como roda o projeto e comandos.

Parte do código foi escrita junto com o Claude. Revisei, e ajustei conforme necessidade. Consigo explicar qualquer linha.

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
