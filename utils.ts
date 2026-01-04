export const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Remove .00 but keep other decimals
  return formatted.replace(/\.00$/, '');
};

export const formatNumber = (num: number, isPercentage = false) => {
  if (isPercentage) {
    // If percentage is less than 10, show up to 2 decimals. 
    // Otherwise round to whole number.
    if (num < 10) {
      return parseFloat(num.toFixed(2)).toString();
    }
    return Math.round(num).toString();
  }
  
  // For standard numbers, remove .00 trailing zeros
  return parseFloat(num.toFixed(2)).toLocaleString('en-US');
};

export const round = (num: number) => {
  return Math.round(num * 100) / 100;
};