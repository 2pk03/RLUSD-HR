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
 <!-- src/views/RegisterUser.vue -->
<template>
    <div class="register-form">
      <h2>Register New Employee</h2>
      
      <form @submit.prevent="registerEmployee">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="employee.username" required />
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="employee.email" required />
        </div>
        
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="employee.password" required />
        </div>
        
        <div class="form-group">
          <label for="role">Role:</label>
          <select id="role" v-model="employee.role" required>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Reactive variables
const employee = ref({
  username: '',
  email: '',
  password: '',
  role: 'employee'
});
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const router = useRouter();

// Function to register a new employee
async function registerEmployee() {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  
  const token = localStorage.getItem('token');
  if (!token) {
    router.push({ name: 'Login' });
    return;
  }
  
  try {
    await axios.post('/api/users/register', employee.value, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    successMessage.value = 'Employee registered successfully!';
    // Reset form fields
    employee.value = {
      username: '',
      email: '',
      password: '',
      role: 'employee'
    };
  } catch (error) {
    console.error('Error registering employee:', error);
    errorMessage.value = error.response?.data?.message || 'Failed to register employee.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.register-form h2 {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.success-message {
  margin-top: 20px;
  color: #28a745;
  text-align: center;
}

.error-message {
  margin-top: 20px;
  color: #dc3545;
  text-align: center;
}
</style>
