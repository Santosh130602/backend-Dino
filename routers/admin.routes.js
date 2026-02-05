
const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.controller");
const {authenticate, requireAdmin} = require("../middleware/auth.middleware");
const { apiLimiter } = require("../middleware/rateLimit.middleware");


router.use(apiLimiter);      
router.use(authenticate);    
router.use(requireAdmin);    

router.post("/tasks", admin.createTask);
router.post("/tasks/bulk", admin.createBulkTasks);
router.get("/tasks", admin.getAllTasks);
router.delete("/tasks/:taskId", admin.deleteTask);

router.post("/items", admin.createItem);
router.post("/items/bulk", admin.createBulkItems);
router.get("/items", admin.getAllItems);
router.delete("/items/:itemId", admin.deleteItem);

router.post("/conversion-rates", admin.setConversionRates);

module.exports = router;







