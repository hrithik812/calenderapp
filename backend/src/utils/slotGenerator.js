const { Op } = require("sequelize");
const { Booking } = require("../models");

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const SLOT_INTERVAL_MINUTES = 30;

const hasConflict = (start, end, existingBookings) =>
  existingBookings.some(
    (booking) =>
      start < new Date(booking.endTime) && end > new Date(booking.startTime)
  );

const getAvailableSlots = async (dateString, durationMinutes) => {
  const dayStart = new Date(`${dateString}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateString}T23:59:59.999Z`);

  const existingBookings = await Booking.findAll({
    where: {
      status: "confirmed",
      startTime: {
        [Op.gte]: dayStart,
        [Op.lte]: dayEnd,
      },
    },
    order: [["startTime", "ASC"]],
  });

  const slots = [];
  const current = new Date(`${dateString}T${String(WORK_START_HOUR).padStart(2, "0")}:00:00.000Z`);
  const workEnd = new Date(`${dateString}T${String(WORK_END_HOUR).padStart(2, "0")}:00:00.000Z`);

  while (current < workEnd) {
    const slotStart = new Date(current);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    if (slotEnd <= workEnd && !hasConflict(slotStart, slotEnd, existingBookings)) {
      slots.push(slotStart.toISOString());
    }

    current.setMinutes(current.getMinutes() + SLOT_INTERVAL_MINUTES);
  }

  return slots;
};

module.exports = { getAvailableSlots };
