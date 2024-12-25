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

<template>
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <router-link to="/user-management">Manage Users</router-link>
      <!-- Other admin functionalities -->
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminDashboard',
  };
  </script>
  
  <style scoped>
  .admin-dashboard {
    padding: 20px;
  }
  
  .admin-dashboard a {
    display: inline-block;
    margin: 10px 0;
    color: #42b983;
    text-decoration: none;
  }
  
  .admin-dashboard a:hover {
    text-decoration: underline;
  }
  </style>
  