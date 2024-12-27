/*
 * router/index.js
 * 
 * Defines API routes for importing and exporting employee data via CSV.
 * Also includes a route to fetch employee records and additional routes for authentication and profile management.
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
import RegisterPage from '../src/views/RegisterPage.vue'; // New Register Component
import EmployeeProfile from '../src/views/EmployeeProfile.vue'; // New Employee Profile Component
import AdminPanel from '../src/views/AdminPanel.vue'; // New Admin Panel Component
import NotFound from '../src/views/NotFound.vue';
import XRPayroll from '../src/XRPayroll.vue';
import Dashboard from '../src/views/Dashboard.vue'; // New Dashboard Component
import Payments from '../src/views/Payments.vue'; // New Payments Component
import TrustLines from '../src/views/TrustLines.vue'; // New Trust Lines Component

const routes = [
  {
    path: '/',
    component: XRPayroll,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { role: 'admin' }, // Admin only
      },
      {
        path: 'admin',
        name: 'AdminPanel',
        component: AdminPanel,
        meta: { role: 'admin' }, // Admin only
      },
      {
        path: 'profile',
        name: 'EmployeeProfile',
        component: EmployeeProfile,
        meta: { role: 'employee' }, // Employee only
      },
      {
        path: 'trustlines',
        name: 'TrustLines',
        component: TrustLines,
        meta: { role: 'admin' }, // Admin only
      },
      {
        path: 'payments',
        name: 'Payments',
        component: Payments,
        meta: { role: 'admin' }, // Admin only
      },
      {
        path: 'register',
        name: 'RegisterUser',
        component: RegisterPage,
        meta: { role: 'admin' }, // Admin only
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guest: true }, // Accessible only to non-authenticated users
  },
  {
    path: '/logout',
    name: 'Logout',
    beforeEnter: (to, from, next) => {
      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      next({ name: 'Login' });
    },
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
  const guestOnly = to.matched.some(record => record.meta.guest);
  const requiredRole = to.meta.role;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user info is stored as JSON

  if (requiresAuth) {
    if (!token) {
      // User is not authenticated
      console.warn('Authentication required. Redirecting to Login.');
      next({ name: 'Login' });
    } else {
      try {
        // Optionally, decode the token to verify its validity
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isTokenExpired = payload.exp * 1000 < Date.now();

        if (isTokenExpired) {
          console.warn('Token expired. Redirecting to Login.');
          // Optionally, you can dispatch a logout action here
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          next({ name: 'Login' });
        } else {
          if (requiredRole && user.role !== requiredRole) {
            // User does not have the required role
            console.warn(`User role '${user.role}' does not have access to this route.`);
            next({ name: 'Dashboard' }); // Redirect to Dashboard or an unauthorized page
          } else {
            next(); // User is authenticated and authorized
          }
        }
      } catch (err) {
        console.error('Error decoding token:', err.message);
        // Invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        next({ name: 'Login' });
      }
    }
  } else if (guestOnly) {
    if (token) {
      // Authenticated users should not access guest routes like Login
      console.warn('Authenticated user trying to access guest route. Redirecting to Dashboard.');
      next({ name: 'Dashboard' });
    } else {
      next(); // User is not authenticated and accessing guest route
    }
  } else {
    next(); // Route does not require authentication
  }
});

export default router;
