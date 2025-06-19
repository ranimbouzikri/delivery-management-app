const Joi = require('joi');

const validateRoute = (req, res, next) => {
  const schema = Joi.object({
    chauffeur: Joi.string().length(24).hex().required(),
    deliveries: Joi.array().items(Joi.string().length(24).hex()).required(),
    date: Joi.date().iso().required(),
    status: Joi.string().valid('planifiée', 'en cours', 'terminée').optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { validateRoute };
