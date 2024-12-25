/*
 * issuerwallet.js
 * 
 * Sets up and exports the SQLite database connection.
 * Ensures the `employees` and `transactions` tables exist.
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

const xrpl = require('xrpl');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const ENV_PATH = path.resolve(__dirname, '.env');

/**
 * Generates a new XRPL wallet.
 * @returns {xrpl.Wallet} The generated wallet.
 */
function generateWallet() {
  const wallet = xrpl.Wallet.generate();
  console.log(`Generated new Issuer Wallet Address: ${wallet.classicAddress}`);
  return wallet;
}

/**
 * Generates a secure random JWT secret.
 * @returns {string} The generated JWT secret.
 */
function generateJwtSecret() {
  return crypto.randomBytes(64).toString('hex'); // 128 characters
}

/**
 * Writes the issuer wallet's seed and JWT secret to the .env file.
 * @param {string} seed - The seed of the wallet.
 * @param {string} jwtSecret - The JWT secret.
 */
function writeEnvFile(seed, jwtSecret) {
  const envContent = `ISSUER_WALLET_SEED=${seed}\nJWT_SECRET=${jwtSecret}\n`;
  fs.writeFileSync(ENV_PATH, envContent, { encoding: 'utf8', flag: 'w' });
  console.log('.env file created with the Issuer Wallet Seed and JWT Secret.');
}

/**
 * Loads the issuer wallet from the seed stored in .env.
 * If .env or the seed is missing, generates a new wallet and JWT secret, writes to .env.
 * @returns {Promise<{ wallet: xrpl.Wallet, jwtSecret: string }>} The loaded or newly generated wallet and JWT secret.
 */
async function getIssuerWalletAndJwtSecret() {
  const seed = process.env.ISSUER_WALLET_SEED;
  const jwtSecret = process.env.JWT_SECRET;

  let needsRestart = false;

  // Check if ISSUER_WALLET_SEED exists
  if (!seed) {
    console.log('ISSUER_WALLET_SEED not found in .env. Generating new wallet...');
    const newWallet = generateWallet();
    const newJwtSecret = generateJwtSecret();
    writeEnvFile(newWallet.seed, newJwtSecret);
    needsRestart = true;
  }

  // Check if JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    if (seed) { // If seed exists but JWT_SECRET missing
      console.log('JWT_SECRET not found in .env. Generating new JWT secret...');
      const newJwtSecret = generateJwtSecret();
      // Append JWT_SECRET to existing .env
      const envContent = `JWT_SECRET=${newJwtSecret}\n`;
      fs.appendFileSync(ENV_PATH, envContent, { encoding: 'utf8', flag: 'a' });
      needsRestart = true;
    }
  }

  if (needsRestart) {
    console.log('Setup complete. Please restart the server to apply the new configuration.');
    process.exit(0); // Exit to allow .env to be loaded on restart
  }

  // At this point, both ISSUER_WALLET_SEED and JWT_SECRET should exist
  const loadedSeed = process.env.ISSUER_WALLET_SEED;
  const loadedJwtSecret = process.env.JWT_SECRET;

  if (!loadedSeed || !loadedJwtSecret) {
    throw new Error('Failed to load ISSUER_WALLET_SEED or JWT_SECRET from .env.');
  }

  const wallet = xrpl.Wallet.fromSeed(loadedSeed);
  console.log(`Loaded Issuer Wallet: ${wallet.classicAddress}`);
  return { wallet, jwtSecret: loadedJwtSecret };
}

module.exports = { getIssuerWalletAndJwtSecret };