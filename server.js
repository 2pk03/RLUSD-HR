/*
 * server.js
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

require('dotenv').config(); // Load existing .env if present
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // For security headers
const morgan = require('morgan'); // For logging
const rateLimit = require('express-rate-limit'); // For rate limiting
const csvRoutes = require('./csvRoutes');
const transactionRoutes = require('./router/transactionRoutes');
const authRoutes = require('./router/authRoutes'); // Existing auth routes
const userRoutes = require('./router/userRoutes'); // New user routes
const employerRoutes = require('./router/employerRoutes');
const employeeRoutes = require('./router/employeeRoutes');
const { getIssuerWalletAndJwtSecret } = require('./issuerWallet');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy to handle X-Forwarded-For correctly
app.set('trust proxy', true);

// Middleware
app.use(helmet()); // Set security-related HTTP headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // Log HTTP requests

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req, res) => req.ip, // Explicitly use req.ip for client identification
});
app.use(limiter); // Apply rate limiting to all requests

// Initialize Variables to Hold Wallet and JWT Secret
let issuerWallet;
let jwtSecret;

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/csv', csvRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/employees', employeeRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('XRPayroll Backend is running.');
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

// Function to start the server after ensuring issuer wallet and JWT secret are loaded
async function startServer() {
  try {
    const credentials = await getIssuerWalletAndJwtSecret();
    issuerWallet = credentials.wallet;
    jwtSecret = credentials.jwtSecret;

    // Make jwtSecret and issuerWallet available to other modules if needed
    app.set('jwtSecret', jwtSecret);
    app.set('issuerWallet', issuerWallet);

    // Start Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Issuer Wallet Address: ${issuerWallet.classicAddress}`);
    });
  } catch (error) {
    console.error('Failed to initialize issuer wallet and JWT secret:', error.message);
    process.exit(1);
  }
}

startServer();
