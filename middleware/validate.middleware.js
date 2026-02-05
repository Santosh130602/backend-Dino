const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(d => d.message),
    });
  }

  req.body = value;
  next();
};

module.exports = validate;
