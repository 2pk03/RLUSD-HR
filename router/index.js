/*
 * router/index.js
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

import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../src/views/HomePage.vue';
import UserManagement from '../src/components/UserManagement.vue';
import LoginPage from '../src/views/LoginPage.vue';
import NotFound from '../src/views/NotFound.vue';
import XRPayroll from '../src/XRPayroll.vue';

const routes = [
  {
    path: '/',
    component: XRPayroll,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: HomePage,
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { role: 'admin' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation Guard to Protect Routes
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRole = to.meta.role;
  const token = localStorage.getItem('token');

  if (requiresAuth) {
    if (!token) {
      // User is not authenticated
      next({ name: 'Login' });
    } else {
      try {
        // Decode the token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (requiredRole && payload.role !== requiredRole) {
          // User does not have the required role
          next({ name: 'Home' });
        } else {
          next(); // User is authorized
        }
      } catch (err) {
        console.error('Error decoding token:', err.message);
        next({ name: 'Login' });
      }
    }
  } else {
    next(); // Route does not require authentication
  }
});

export default router;

