const { createAssetTable } = require("./asset.model");
const { createUserTable } = require("./user.model");
const { createWalletTable } = require("./wallet.model");
const { createSystemWalletTable } = require("./system.model");
const { createLedgerTable } = require("./ledger.model");
const { createTaskTable } = require("./task.model");
const { createItemTable } = require("./item.model");
const { createUserTaskTable } = require("./userTask.model");
const { createConversionTable } = require("./conversion.model");
const {createTransactionTable} = require("./transaction.model")

const initModels = async () => {
  try {
    await createAssetTable();
    await createUserTable();
    await createWalletTable();
    await createSystemWalletTable();
    await createTaskTable();
    await createItemTable();
    await createUserTaskTable();
    await createConversionTable();
    await createLedgerTable();
    await createTransactionTable();

    console.log("All tables created successfully!");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
};

module.exports = initModels;
