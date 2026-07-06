const express = require("express");
const {
  getSlots,
  createBooking,
  myBookings,
  allBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/slots", getSlots);
router.get("/mine", requireAuth, myBookings);
router.get("/all", requireAuth, requireAdmin, allBookings);
router.post("/",requireAuth, createBooking);
router.patch("/:id/cancel", requireAuth, cancelBooking);

module.exports = router;
