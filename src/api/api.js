/*
 * src/api/api.js
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

import axios from 'axios';
import store from '../store'; 
import router from '../router'; 

const api = axios.create({
  baseURL: '/api', // Proxy is set up in vue.config.js
  // Optionally, set other configurations like timeout
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = store.state.auth.token; // Access token from Vuex store
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be expired or invalid
      store.dispatch('auth/logout'); // Clear token and user data
      router.push({ name: 'Login' }); // Redirect to Login page
    }
    return Promise.reject(error);
  }
);

export default api;
