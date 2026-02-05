const Joi = require("joi");

exports.topUpSchema = Joi.object({
  userId: Joi.number().required(),
  assetId: Joi.number().required(),
  amount: Joi.number().positive().required(),
});

exports.convertSilverSchema = Joi.object({
  userId: Joi.number().required(),
  silverAmount: Joi.number().multiple(50).required(),
});

exports.convertGoldSchema = Joi.object({
  userId: Joi.number().required(),
  goldAmount: Joi.number().multiple(50).required(),
});
