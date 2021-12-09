const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('articles', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    img: {
      type: DataTypes.TEXT, // INTEGER ?
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Projects', 'Course', 'News'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pause', 'InProgress', 'Approved'),
      allowNull: true,
    },
    voteCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  });
};
