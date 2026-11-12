# Parte B — Correção da função de valor atualizado

## Os defeitos

**1. O cliente que paga no dia do vencimento paga com multa**

O problema acontece no loop for, que tem no parâmetro o `i <= diasAtraso`. Se o cliente paga no dia do vencimento, `diasAtraso` é 0, mas como o sinal é `menor ou igual`, o loop roda uma vez e ele conta como atraso. Se atrasar 1 dia, o loop roda com o dia 0 e com o dia 1, e ele paga por 2 dias de atraso.

Cliente pagou em dia e foi cobrado como atrasado, e todo atraso conta um dia a mais.

**2. Multa cobrada todos os dias**

A multa está dentro do loop, então é cobrado `valor * 0.02` a cada dia de atraso. Pela regra, a multa é cobrada uma única vez, e os juros de 0,033% (`0.00033`) é que são cobrados por dia de atraso.

Cliente com 10 dias de atraso, paga 11 multas de 2% em vez de uma.

**3. Juros compostos**

Juros compostos pois o código está aplicando os juros (`total * 0.00033`) no valor que já tem a multa dos 2% e os juros dos dias anteriores. Pela regra, os juros são simples, sobre o valor original.

O cliente paga juros sobre juros e sobre a multa.

**4. Retorno sem arredondamento**

A função não retorna os valores arredondados em centavos como pede o enunciado.

O valor pode aparecer diferente

## Função corrigida

```ts
function calcularValorAtualizado(
  valor: number,
  vencimento: string,
  dataPagamento: string,
): number {

  // igual à original, só troquei Math.floor por Math.round para não perder um dia por causa de horário
  const venc = new Date(vencimento);
  const pag = new Date(dataPagamento);
  const diasAtraso: number = Math.round((pag.getTime() - venc.getTime()) / 86400000);


  // primeira solução: Não cobrar quem paga no dia do vencimento.
  if (diasAtraso <= 0) {
    return valor;
  }

  // segunda solução: usar valores em centavos para fazer o cálculo pois dá um número inteiro
  const valorCentavos: number = Math.round(valor * 100);


  // terceira solução: a função original usou de forma errada a expressão para calcular a multa e juros.
  const multa: number = valorCentavos * 0.02;

 // Quarta solução: juros simples sobre o valor original, sem loop
  const juros: number = valorCentavos * 0.00033 * diasAtraso;

  // Quinta solução: arredonda em centavos e volta para reais
  return Math.round(valorCentavos + multa + juros) / 100;

}
```

## Valores

Mensalidade de R$ 189,90, vencimento em 05/10/2026.

| Pagamento | Dias de atraso | Valor |
|---|---|---|
| 01/10/2026 | 0 (antecipado) | R$ 189,90 |
| 05/10/2026 | 0 | R$ 189,90 |
| 06/10/2026 | 1 | R$ 193,76 |
| 15/10/2026 | 10 | R$ 194,32 |

Conta do dia 15/10:

```
multa = 18990 × 2% = 379,8
juros = 18990 × 0,033% × 10 = 62,667
total = 18990 + 379,8 + 62,667 = 19432,467 

arredondada: 19432 / 100 => R$ 194,32
```
