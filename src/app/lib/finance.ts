export const formatCurrency = (amount: number, currency: string = 'PYG') => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };

  if (currency === 'PYG') {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }

  return new Intl.NumberFormat('es-PY', options).format(amount);
};

export const formatNumberWithDots = (value: number) => {
  if (!value) return '';
  return Math.trunc(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseNumberFromDots = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getDefaultDateForMonth = (_month: string) => {
  return new Date().toISOString().split('T')[0];
};
