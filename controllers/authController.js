/*
 * controllers/authController.js
 * 
 * Defines API routes for importing and exporting employee data via CSV.
 * Also includes a route to fetch employee records.
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

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user data (Replace with your database logic)
const users = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('adminpassword', 8), // Hashed password
    role: 'admin',
  },
  {
    id: 2,
    username: 'employee',
    password: bcrypt.hashSync('employeepassword', 8), // Hashed password
    role: 'employee',
  },
];

// Retrieve JWT Secret from app settings
const getJwtSecret = (app) => app.get('jwtSecret');

exports.login = (req, res) => {
  const { username, password } = req.body;
  const app = req.app;
  const jwtSecret = getJwtSecret(app);

  // Validate request
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  // Find user by username
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Compare passwords
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  if (!passwordIsValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Create JWT payload
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  // Sign token
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: '1h', // Token expires in 1 hour
  });

  // Respond with token
  res.status(200).json({ token });
};
