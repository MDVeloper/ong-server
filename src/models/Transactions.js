const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('transactions', {
    status: {
      type: DataTypes.ENUM("Reject", "Error", "Approved"),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("MercadoPago", "PayPal"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
