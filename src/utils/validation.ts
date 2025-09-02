import Joi from 'joi';

export const generateCouponSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  projectId: Joi.string().uuid().required(),
  purchaseId: Joi.number().integer().positive().required(),
  businessInfo: Joi.object().required(),
  activityType: Joi.string().min(1).required(),
  expirationDays: Joi.number().integer().min(1).default(365)
});

export interface ValidationResult {
  error?: {
    details: Array<{ message: string; path: (string | number)[]; type: string; }>;
  };
  value?: any;
}

export const validateInput = (schema: Joi.Schema, input: any): ValidationResult => {
  const result = schema.validate(input, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
  
  return {
    error: result.error ? {
      details: result.error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }))
    } : undefined,
    value: result.value
  };
};