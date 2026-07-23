const { Booking, Service, User } = require("../models");
const {
  getAvailableSlots,
  isWithinWorkingHours,
} = require("../utils/slotGenerator");

const getSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({
        message: "date and serviceId are required",
      });
    }

    const service = await Service.findByPk(serviceId);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const slots = await getAvailableSlots(date, service.durationMinutes);

    console.log("Slots---",slots);
    
    return res.json({ slots });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch slots",
    });
  }
};

const createBooking = async (req, res) => {
  try {
    const { serviceId, startTime, notes } = req.body;

    if (!serviceId || !startTime) {
      return res.status(400).json({
        message: "serviceId and startTime are required",
      });
    }

    const service = await Service.findByPk(serviceId);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const slotDate = new Date(startTime);



    const endTime = new Date(
      slotDate.getTime() + service.durationMinutes * 60000
    );

    // Validate business hours (9 AM - 5 PM)
    if (!isWithinWorkingHours(slotDate, endTime)) {
      return res.status(400).json({
        message: "Bookings are only allowed between 9:00 AM and 5:00 PM.",
      });
    }

    const dateString = slotDate.toISOString().slice(0, 10);

    const availableSlots = await getAvailableSlots(
      dateString,
      service.durationMinutes
    );

    if (!availableSlots.includes(slotDate.toISOString())) {
      return res.status(409).json({
        message: "Selected slot is no longer available.",
      });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      serviceId,
      startTime: slotDate,
      endTime,
      notes: notes || null,
    });

    return res.status(201).json({
      booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

const myBookings = async (req, res) => {
  const { Op } = require("sequelize");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await Booking.findAll({
    where: {
      userId: req.user.id,
      status: "confirmed",
      startTime: {
        [Op.gte]: today,
      },
    },
    include: [{ model: Service }],
    order: [["startTime", "ASC"]],
  });

  return res.json({ bookings });
};

const allBookings = async (_req, res) => {
  const { Op } = require("sequelize");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bookings = await Booking.findAll({
    where: {
      status: "confirmed",
      startTime: {
        [Op.gte]: today,
      },
    },
    include: [
      {
        model: User,
        attributes: ["id", "name", "email"],
      },
      {
        model: Service,
      },
    ],
    order: [["startTime", "ASC"]],
  });


  const bookingsWithUserName = bookings.map((booking) => {
    const plain = booking.get({ plain: true });
    return {
      ...plain,
      userName: plain.User?.name ?? null,
    };
  });
  
  return res.json({ bookings: bookingsWithUserName });
};

const cancelBooking = async (req, res) => {

  

  const booking = await Booking.findByPk(req.params.id);
  
  console.log(booking);
  
  if (!booking) {
    return res.status(404).json({
      message: "Booking not found",
    });
  }

  if (booking.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden",
    });
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