const sequelize = require("../config/database");
const User = require("./user");
const Service = require("./service");
const Booking = require("./booking");

User.hasMany(Booking, { foreignKey: "userId" });
Booking.belongsTo(User, { foreignKey: "userId" });

Service.hasMany(Booking, { foreignKey: "serviceId" });
Booking.belongsTo(Service, { foreignKey: "serviceId" });

module.exports = {
  sequelize,
  User,
  Service,
  Booking,
};
