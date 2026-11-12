export function limparCpf(cpf: string): string{
  return cpf.replace(/\D/g, '');
};

function calcularDigito(base: string): number {
  let soma: number = 0;
  let peso: number = base.length + 1; // Peso sempre base + 1
  
  for(let i = 0; i<base.length; i++){
    soma += Number(base[i]) * peso;
    peso--; // peso diminui conforme número
  };

  const resto: number = soma % 11;
  return resto < 2 ? 0 : 11 - resto; 
};


// valida: CPF, números iguais e os 2 verificadores.

export function validarCpf(cpf:string): boolean{
  const cpfLimpo:string = limparCpf(cpf);

  if(cpfLimpo.length !== 11){
    return false;
  }

  // retorna false se todos os números forem iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  

  // calculo com base em 9
  const base9 = calcularDigito(cpfLimpo.slice(0, 9));
  if (base9 !== Number(cpfLimpo[9])) {
    return false;
  }

  // calculo com base em 10
  const base10 = calcularDigito(cpfLimpo.slice(0, 10));
  if (base10 !== Number(cpfLimpo[10])) {
    return false;
  }

  return true;
}
