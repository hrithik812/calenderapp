const { Service } = require("../models");

const listServices = async (_req, res) => {
  const services = await Service.findAll({ order: [["createdAt", "DESC"]] });
  return res.json({ services });
};

const createService = async (req, res) => {
  try {
    const { name, description, durationMinutes, price } = req.body;
    if (!name || !durationMinutes) {
      return res.status(400).json({ message: "Name and duration are required" });
    }

    const service = await Service.create({
      name,
      description,
      durationMinutes,
      price: price ?? 0,
    });

    return res.status(201).json({ service });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create service" });
  }
};

module.exports = { listServices, createService };
