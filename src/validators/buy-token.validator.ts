import Joi from 'joi';

export const validateBuyTokenInput = (input: any) => {
  const schema = Joi.object({
    project_id: Joi.number().integer().required(),
    user_id: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
  });

  return schema.validate(input);
};
