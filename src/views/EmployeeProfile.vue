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
<!-- src/views/EmployeeProfile.vue -->
<template>
    <div class="employee-profile">
      <h2>My Profile</h2>
      
      <form @submit.prevent="updateProfile">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="profile.username" disabled />
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="profile.email" required />
        </div>
        
        <div class="form-group">
          <label for="password">New Password:</label>
          <input type="password" id="password" v-model="profile.password" placeholder="Leave blank to keep current password" />
        </div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Profile' }}
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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'vue-router';

// Reactive variables
const profile = ref({
  username: '',
  email: '',
  password: ''
});
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const router = useRouter();

// Function to fetch current user profile
async function fetchProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push({ name: 'Login' });
    return;
  }
  
  try {
    const decoded = jwtDecode(token);
    profile.value.username = decoded.username;
    
    const response = await axios.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    profile.value.email = response.data.email;
  } catch (error) {
    console.error('Error fetching profile:', error);
    errorMessage.value = 'Failed to load profile. Please try again.';
  }
}

// Function to update user profile
async function updateProfile() {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  
  const token = localStorage.getItem('token');
  if (!token) {
    router.push({ name: 'Login' });
    return;
  }
  
  // Prepare payload
  const payload = {
    email: profile.value.email
  };
  
  if (profile.value.password) {
    payload.password = profile.value.password;
  }
  
  try {
    await axios.put('/api/users/profile', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    successMessage.value = 'Profile updated successfully!';
    profile.value.password = ''; // Clear password field
  } catch (error) {
    console.error('Error updating profile:', error);
    errorMessage.value = error.response?.data?.message || 'Failed to update profile.';
  } finally {
    loading.value = false;
  }
}

// Fetch profile on component mount
onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.employee-profile {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.employee-profile h2 {
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

.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #28a745;
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
