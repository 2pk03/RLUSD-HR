/*
 * RLUSD Cross-Border Employee Demo
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
<!-- src/components/Register.vue -->
<template>
    <div class="register-container">
      <h2>Register New User</h2>
      <form @submit.prevent="handleRegister">
        <div>
          <label for="username">Username:</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            minlength="3"
          />
        </div>
        <div>
          <label for="password">Password:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            minlength="6"
          />
        </div>
        <div>
          <label for="role">Role:</label>
          <select id="role" v-model="role" required>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div v-if="role === 'employee'">
          <label for="employerID">Employer ID:</label>
          <input
            type="number"
            id="employerID"
            v-model.number="employerID"
            required
            min="1"
          />
        </div>
        <div v-if="role === 'employee'">
          <label for="payrollAmount">Payroll Amount:</label>
          <input
            type="number"
            id="payrollAmount"
            v-model.number="payrollAmount"
            required
            min="0"
            step="0.01"
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script>
  import { mapActions } from 'vuex';
  
  export default {
    name: 'Register',
    data() {
      return {
        username: '',
        password: '',
        role: 'employee',
        employerID: null,
        payrollAmount: null,
        successMessage: '',
        errorMessage: '',
      };
    },
    methods: {
      ...mapActions('auth', ['register']),
      async handleRegister() {
        const userData = {
          username: this.username,
          password: this.password,
          role: this.role,
        };
  
        if (this.role === 'employee') {
          userData.employerID = this.employerID;
          userData.payrollAmount = this.payrollAmount;
        }
  
        try {
          const response = await this.register(userData);
          this.successMessage = response.data.message;
          this.errorMessage = '';
          // Optionally, reset form fields
          this.username = '';
          this.password = '';
          this.role = 'employee';
          this.employerID = null;
          this.payrollAmount = null;
        } catch (error) {
          if (error.response && error.response.data) {
            if (error.response.data.errors) {
              // Validation errors
              this.errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
            } else if (error.response.data.message) {
              this.errorMessage = error.response.data.message;
            } else {
              this.errorMessage = 'An error occurred during registration.';
            }
          } else {
            this.errorMessage = 'An error occurred during registration.';
          }
          this.successMessage = '';
          console.error('Registration error:', error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .register-container {
    max-width: 500px;
    margin: auto;
    padding: 2rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  .success {
    color: green;
    margin-top: 1rem;
  }
  
  .error {
    color: red;
    margin-top: 1rem;
  }
  </style>
  