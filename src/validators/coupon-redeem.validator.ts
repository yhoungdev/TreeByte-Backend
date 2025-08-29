import Joi from 'joi';

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const bodySchema = Joi.object({
  userId: Joi.string().uuid().required(),
  redemptionLocation: Joi.string().max(255).optional(),
  redemptionNotes: Joi.string().max(1000).optional(),
  businessVerification: Joi.string().max(255).optional(),
});

export const validateCouponRedeemInput = (input: any) => {
  const schema = Joi.object({
    params: paramsSchema.required(),
    body: bodySchema.required(),
  });
  return schema.validate(input);
};
