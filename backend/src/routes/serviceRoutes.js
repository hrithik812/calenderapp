const express = require("express");
const { listServices, createService } = require("../controllers/serviceController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listServices);
router.post("/", requireAuth, requireAdmin, createService);

module.exports = router;
