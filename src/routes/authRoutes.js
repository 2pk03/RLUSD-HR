/*
 * authRoutes.js
 * 
 * Defines API routes for user authentication, including login and registration.
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

require('dotenv').config(); // Load existing .env if present
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../../database');

const router = express.Router();

// Middleware to authenticate JWT tokens
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.warn('No authorization header provided');
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Assuming "Bearer <token>"
  
  if (!token) {
    console.warn('No token found in authorization header');
    return res.status(401).json({ message: 'No token provided.' });
  }

  const jwtSecret = req.app.get('jwtSecret');
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
    // Save user info for future middleware/routes
    req.user = decoded;
    next();
  });
};

// Authorization middleware to check for admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.warn(`User ${req.user.username} attempted to access admin route`);
    return res.status(403).json({ message: 'Forbidden. Admins only.' });
  }
  next();
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user (Admin only)
 * @access Protected
 */
router.post(
  '/register',
  authenticate,
  authorizeAdmin,
  [
    body('username')
      .isString()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long.')
      .trim()
      .escape(),
    body('password')
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.')
      .trim(),
    body('role')
      .isIn(['admin', 'employee'])
      .withMessage('Role must be either admin or employee.')
      .trim()
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Registration failed: Validation errors');
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;

    console.log('Received registration request:', { username, role });

    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        console.error('Database error during registration:', err.message);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (row) {
        console.warn(`Registration failed: User ${username} already exists`);
        return res.status(400).json({ message: 'User already exists.' });
      }

      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`Password hashed for user ${username}`);

        // Insert the new user
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [username, hashedPassword, role],
          function (err) {
            if (err) {
              console.error('Error inserting user:', err.message);
              return res.status(500).json({ message: 'Error registering user.' });
            }

            console.log(`User registered successfully: ${username}`);
            res.status(201).json({ message: 'User registered successfully.' });
          }
        );
      } catch (hashError) {
        console.error('Error hashing password:', hashError.message);
        res.status(500).json({ message: 'Error registering user.' });
      }
    });
  }
);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
router.post(
  '/login',
  [
    body('username')
      .isString()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long.')
      .trim()
      .escape(),
    body('password')
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.')
      .trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Login failed: Validation errors');
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    console.log('Received login request:', { username });

    // Fetch user from the database
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error during login:', err.message);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (!user) {
        console.warn(`Login failed: User ${username} not found`);
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      try {
        // Compare passwords
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.warn(`Login failed: Incorrect password for user ${username}`);
          return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Retrieve JWT Secret from app settings
        const jwtSecret = req.app.get('jwtSecret');
        if (!jwtSecret) {
          console.error('JWT secret not configured in the server');
          return res.status(500).json({ message: 'Server configuration error.' });
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

        console.log(`User ${username} authenticated successfully`);

        // Respond with token
        res.status(200).json({ token });
      } catch (authError) {
        console.error('Error during authentication:', authError.message);
        res.status(500).json({ message: 'Authentication error.' });
      }
    });
  }
);

module.exports = router;
