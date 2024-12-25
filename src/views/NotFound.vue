<template>
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/">Go to Home</router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
};
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 100px;
  font-family: Arial, sans-serif;
}

.not-found h1 {
  color: #dc3545;
}

.not-found a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

.not-found a:hover {
  text-decoration: underline;
}
</style>
