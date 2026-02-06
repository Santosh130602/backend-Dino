const express = require("express");
const router = express.Router();
const wallet = require("../controllers/wallet.controller");
const {authenticate,} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { 
  topUpSchema, 
  convertSilverSchema, 
  convertGoldSchema 
} = require("../validators/wallet.validator");


router.use(authenticate);


router.get("/:userId", wallet.getBalance);

router.get("/:userId/:assetId", wallet.getAssetBalance);

router.post("/:userId/:assetId/topup", wallet.topUpWallet);

router.post("/:userId/:assetId/bonus" , wallet.giveBonus);

router.post( "/:userId/:itemId/spend", wallet.spendWallet); 


router.post( "/convert/silver-to-gold", validate(convertSilverSchema), wallet.convertSilverToGold);

router.post( "/convert/gold-to-diamond", validate(convertGoldSchema), wallet.convertGoldToDiamond);

module.exports = router;

