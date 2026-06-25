export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const formatMoney = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
