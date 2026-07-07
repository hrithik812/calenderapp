require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Service } = require("../models");

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const adminPassword = await bcrypt.hash("Shanta@2026", 15);
    await User.findOrCreate({
      where: { email: "admin@shanta-aml.com" },
      defaults: {
        name: "Admin User",
        passwordHash: adminPassword,
        role: "admin",
      },
    });

    const defaults = [
      {
        name: "30-Minute Meeting",
        description: "30 Minute Meeting with Shanta",
        durationMinutes: 30,
      },
      {
        name: "60 Minute Meeting",
        description: "60 Minute Meeting with Shanta",
        durationMinutes: 60,
        price: 65.0,
      },
    ];

    for (const serviceData of defaults) {
      await Service.findOrCreate({
        where: { name: serviceData.name },
        defaults: serviceData,
      });
    }

    console.log("Seed completed.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seed();
