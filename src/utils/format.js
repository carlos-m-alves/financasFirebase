export const formatNumber = (value, digits = 2) =>
  value == null ? '—' : value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const formatCurrency = (value, digits = 2, prefix = 'R$ ') =>
  value == null ? '—' : `${prefix}${formatNumber(value, digits)}`;

export const formatPercent = (value, digits = 2) => formatNumber(value, digits) + '%';
