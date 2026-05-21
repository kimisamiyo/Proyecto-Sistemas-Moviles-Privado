export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validatePassword = (password) => password.length >= 6;

export const validateRequired = (value, min = 1) => value?.trim?.().length >= min;

export const parseApiErrors = (error) => {
  const details = error?.response?.data?.details;
  if (Array.isArray(details)) return details.map((d) => d.message).join('\n');
  return error?.response?.data?.error || error?.message || 'Error desconocido';
};
