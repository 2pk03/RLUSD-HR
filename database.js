/*
 * userRoutes.js
 * 
 * Defines API routes for user management, including fetching, updating, and deleting user records.
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

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const bcrypt = require('bcrypt') // Added bcrypt for password hashing

// Initialize SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'XRPayroll.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  } else {
    console.log('Connected to SQLite database.')
    db.run('PRAGMA foreign_keys = ON;', (err) => { // Enable foreign key constraints
      if (err) {
        console.error('Failed to enable foreign keys:', err.message)
        process.exit(1)
      }
    })
  }
})

// Initialize the database tables
db.serialize(() => {
  // Create the users table with a CHECK constraint on role
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee'))
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create users table:', err.message);
      process.exit(1);
    }
    console.log('Users table is ready.');
  });

  // Create the employers table
  db.run(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create employers table:', err.message);
      process.exit(1);
    }
    console.log('Employers table is ready.');
  });

  // Create the employees table
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userID INTEGER UNIQUE NOT NULL,
      employerID INTEGER NOT NULL,
      payrollAmount REAL NOT NULL,
      FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employerID) REFERENCES employers(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create employees table:', err.message);
      process.exit(1);
    }
    console.log('Employees table is ready.');
  });

  // Create the transactions table with corrected foreign key
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      wallet_address TEXT NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      tx_id TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create transactions table:', err.message);
      process.exit(1);
    }
    console.log('Transactions table is ready.');
  });

  // Insert a default employer if not exists
  db.get('SELECT * FROM employers WHERE name = ?', ['Default Employer'], (err, row) => {
    if (err) {
      console.error('Error querying employers:', err.message);
      return;
    }

    if (!row) {
      db.run('INSERT INTO employers (name) VALUES (?)', ['Default Employer'], function(err) {
        if (err) {
          console.error('Error inserting default employer:', err.message);
        } else {
          console.log('Default employer added with ID:', this.lastID);
        }
      });
    } else {
      console.log('Default employer already exists with ID:', row.id);
    }
  });

  // Insert a default admin user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, user) => {
    if (err) {
      console.error('Error querying users:', err.message);
      return;
    }

    if (!user) {
      try {
        const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword';
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10); // Securely hash the password
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin'], function(err) {
          if (err) {
            console.error('Error inserting admin user:', err.message);
          } else {
            console.log('Admin user created with ID:', this.lastID);
          }
        });
      } catch (hashError) {
        console.error('Error hashing admin password:', hashError.message);
      }
    } else {
      console.log('Admin user already exists with ID:', user.id);
    }
  });
});

module.exports = db
