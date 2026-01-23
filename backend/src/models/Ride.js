const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ride = sequelize.define('Ride', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id'
  },
  trajectoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'trajectory_id'
  },
  rideDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'ride_date'
  },
  direction: {
    type: DataTypes.ENUM('heen', 'terug', 'heen_terug'),
    allowNull: false
  },
  portion: {
    type: DataTypes.ENUM('volledig', 'gedeeltelijk'),
    allowNull: false
  },
  kmTotal: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'km_total'
  },
  amountEuro: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'amount_euro'
  },
  declarationConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'declaration_confirmed'
  },
  declarationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'declaration_date'
  }
}, {
  tableName: 'rides',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Ride;