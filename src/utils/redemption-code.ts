import crypto from 'crypto';

export const generateRedemptionCode = async (): Promise<string> => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

export const generateShortRedemptionCode = async (): Promise<string> => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

export const validateRedemptionCodeFormat = (code: string): boolean => {
  return /^[A-F0-9]{32}$/.test(code) || /^[A-F0-9]{12}$/.test(code);
};