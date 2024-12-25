<!-- src/App.vue -->

<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/users" v-if="isAdmin">User Management</router-link>
      <router-link to="/login" v-if="!isAuthenticated">Login</router-link>
      <button @click="logout" v-if="isAuthenticated">Logout</button>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('token');
    },
    isAdmin() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role === 'admin';
        } catch (e) {
          console.error('Invalid token:', e);
          return false;
        }
      }
      return false;
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      this.$router.push({ name: 'Login' });
    },
  },
};
</script>

<style>
/* Add your styles here */
nav {
  padding: 10px;
  background-color: #f8f8f8;
}

nav a {
  margin-right: 15px;
  text-decoration: none;
  color: #42b983;
}

nav button {
  background: none;
  border: none;
  color: #42b983;
  cursor: pointer;
}
</style>
