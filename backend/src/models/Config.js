const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Config = sequelize.define('Config', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  land: {
    type: DataTypes.ENUM('BE', 'NL'),
    allowNull: false
  },
  tariffPerKm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'tariff_per_km'
  },
  maxPerMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_per_month'
  },
  maxPerYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_per_year'
  },
  deadlineDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'deadline_day'
  },
  allowAboveTaxFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'allow_above_tax_free'
  }
}, {
  tableName: 'config',
  timestamps: false
});

module.exports = Config;