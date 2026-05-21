const { Booking, Service, User } = require("../models");
const { getAvailableSlots } = require("../utils/slotGenerator");

const getSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    if (!date || !serviceId) {
      return res.status(400).json({ message: "date and serviceId are required" });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const slots = await getAvailableSlots(date, service.durationMinutes);
    return res.json({ slots });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
};

const createBooking = async (req, res) => {
  console.log(req.body);

  try {
    const { serviceId, startTime, notes } = req.body;
    if (!serviceId || !startTime) {
      return res.status(400).json({ message: "serviceId and startTime are required" });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const slotDate = new Date(startTime);
    const dateString = slotDate.toISOString().slice(0, 10);
    const availableSlots = await getAvailableSlots(dateString, service.durationMinutes);
    if (!availableSlots.includes(slotDate.toISOString())) {
      return res.status(409).json({ message: "Selected slot is no longer available" });
    }

    const endTime = new Date(slotDate.getTime() + service.durationMinutes * 60000);
    const booking = await Booking.create({
      userId: req.user.id,
      serviceId,
      startTime: slotDate,
      endTime,
      notes: notes || null,
    });

    return res.status(201).json({ booking });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create booking" });
  }
};

const myBookings = async (req, res) => {
  const bookings = await Booking.findAll({
    where: { userId: req.user.id },
    include: [{ model: Service }],
    order: [["startTime", "ASC"]],
  });
  return res.json({ bookings });
};

const allBookings = async (_req, res) => {
  const bookings = await Booking.findAll({
    include: [{ model: User, attributes: ["id", "name", "email"] }, { model: Service }],
    order: [["startTime", "ASC"]],
  });
  return res.json({ bookings });
};

const cancelBooking = async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  booking.status = "cancelled";
  await booking.save();
  return res.json({ booking });
};

module.exports = {
  getSlots,
  createBooking,
  myBookings,
  allBookings,
  cancelBooking,
};
