
const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const {authenticate, requireAdmin} = require("../middleware/auth.middleware");
const { apiLimiter } = require("../middleware/rateLimit.middleware");


router.use(apiLimiter);      
router.use(authenticate);    
// router.use(requireAdmin);    

router.post("/tasks",requireAdmin, admin.createTask);
router.post("/tasks/bulk",requireAdmin, admin.createBulkTasks);
router.get("/tasks", admin.getAllTasks);
router.delete("/tasks/:taskId",requireAdmin, admin.deleteTask);

router.post("/items",requireAdmin, admin.createItem);
router.post("/items/bulk",requireAdmin, admin.createBulkItems);
router.get("/items", admin.getAllItems);
router.delete("/items/:itemId",requireAdmin, admin.deleteItem);

router.post("/conversion-rates",requireAdmin, admin.setConversionRates);

module.exports = router;







