/*
 * src/models/Employer.js
 * 
 * XRPL XBorder Payroll Demo Backend
 * 
 * Copyright (c) 2024 Alexander Alten
 * GitHub Handle: 2pk03
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * http://mozilla.org/MPL/2.0/.
 *
 * Under the MPL, you must preserve this notice. You must also disclose your source 
 * code if you distribute a modified version of this program.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Employee = sequelize.define('Employee', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employee_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  salary: { // RLUSD amount
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  wallet_address: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Employee;
