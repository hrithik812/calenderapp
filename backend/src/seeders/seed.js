require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Service } = require("../models");

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const adminPassword = await bcrypt.hash("admin123", 10);
    await User.findOrCreate({
      where: { email: "admin@koalendar.local" },
      defaults: {
        name: "Admin User",
        passwordHash: adminPassword,
        role: "admin",
      },
    });

    const defaults = [
      {
        name: "30-Minute Consultation",
        description: "Intro call to discuss your needs and next steps.",
        durationMinutes: 30,
        price: 25.0,
      },
      {
        name: "60-Minute Strategy Session",
        description: "Deep-dive planning session with action items.",
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
