import Joi from 'joi';

export const validateBuyTokenInput = (input: any) => {
  const schema = Joi.object({
    project_id: Joi.string().uuid().required(), 
    user_id: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
  });

  return schema.validate(input);
};
