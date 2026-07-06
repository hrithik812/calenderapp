const { Op } = require("sequelize");
const { Booking } = require("../models");

const WORK_START_HOUR = 9; // 9:00 AM
const WORK_END_HOUR = 17; // 5:00 PM
const SLOT_INTERVAL_MINUTES = 30;

/**
 * Check if a booking overlaps with existing bookings.
 */
const hasConflict = (start, end, existingBookings) => {
  return existingBookings.some(
    (booking) =>
      start < new Date(booking.endTime) &&
      end > new Date(booking.startTime)
  );
};

/**
 * Check if a booking falls within working hours.
 */
const isWithinWorkingHours = (startTime, endTime) => {
  const workStart = new Date(startTime);
  workStart.setHours(WORK_START_HOUR, 0, 0, 0);

  const workEnd = new Date(startTime);
  workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

  return startTime >= workStart && endTime <= workEnd;
};

/**
 * Get all available slots for a given date.
 *
 * @param {string} dateString - Format: YYYY-MM-DD
 * @param {number} durationMinutes
 */
const getAvailableSlots = async (dateString, durationMinutes) => {
  // Local day start & end (NO UTC)
  const dayStart = new Date(`${dateString}T00:00:00`);
  const dayEnd = new Date(`${dateString}T23:59:59.999`);

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

  const current = new Date(`${dateString}T09:00:00`);
  const workEnd = new Date(`${dateString}T17:00:00`);

  while (current < workEnd) {
    const slotStart = new Date(current);
    const slotEnd = new Date(
      slotStart.getTime() + durationMinutes * 60 * 1000
    );

    if (
      isWithinWorkingHours(slotStart, slotEnd) &&
      !hasConflict(slotStart, slotEnd, existingBookings)
    ) {
      slots.push(slotStart.toISOString());
    }

    current.setMinutes(current.getMinutes() + SLOT_INTERVAL_MINUTES);
  }

  return slots;
};

module.exports = {
  getAvailableSlots,
  isWithinWorkingHours,
};