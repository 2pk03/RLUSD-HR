<template>
    <div class="container">
      <header>
        <h1>Manage Trust Lines</h1>
      </header>
  
      <!-- Trust Line Table -->
      <section>
        <table v-if="trustLines.length">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Wallet</th>
              <th>Trusted Wallets</th>
              <th>Trusts Issuer</th>
              <th>Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in trustLines" :key="line.wallet_address">
              <td>{{ line.employee_name }}</td>
              <td>{{ line.wallet_address }}</td>
              <td>{{ line.trusted_wallets }}</td>
              <td>{{ line.trusts_issuer }}</td>
              <td>{{ line.limit }}</td>
              <td>
                <button @click="removeTrustLine(line)" class="danger">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>No trust lines found.</p>
      </section>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const trustLines = ref([]);
  
  // Load trust lines from the backend
  const loadTrustLines = async () => {
    try {
      const token = localStorage.getItem('token');
  
      console.log('Fetching employee trust lines with issuer wallet.');
  
      const response = await axios.get('/api/testnet/employees/trustlines', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('Trust lines response:', response.data);
  
      if (response.data.trustLines) {
        trustLines.value = response.data.trustLines.map((line) => ({
          employee_name: line.employee_name || 'Unknown',
          wallet_address: line.wallet_address || 'N/A',
          trusted_wallets: line.trusted_wallets
            ?.map((wallet) => `${wallet.account}`)
            .join(', ') || 'N/A',
          trusts_issuer: line.trusts_issuer ? 'Yes' : 'No',
          limit: line.trusted_wallets?.[0]?.limit || 'N/A', // First wallet's limit for simplicity
        }));
  
        console.log('Mapped trustLines:', trustLines.value);
      } else {
        console.warn('Unexpected API response:', response.data);
        alert('Unexpected response while loading trust lines. Please try again.');
      }
    } catch (error) {
      console.error('Error loading trust lines:', error.response?.data || error.message);
      alert('Failed to load trust lines. Please check the console for details.');
    }
  };
  
  // Remove a trust line
  const removeTrustLine = async (line) => {
    if (confirm(`Are you sure you want to remove the trust line for ${line.employee_name}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/testnet/trustlines/${line.wallet_address}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert(response.data.message || 'Trust line removed successfully.');
        loadTrustLines(); // Reload trust lines
      } catch (error) {
        console.error('Error removing trust line:', error.response?.data || error.message);
        alert('Failed to remove trust line. Please check the console for details.');
      }
    }
  };
  
  onMounted(() => {
    loadTrustLines();
  });
  </script>
  
  <style scoped>
  .container {
    max-width: 80%;
    margin: 0 auto;
    font-family: Arial, sans-serif;
  }
  
  header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  section {
    margin-bottom: 30px;
  }
  
  h2 {
    margin-bottom: 10px;
  }
  
  form div {
    margin-bottom: 10px;
  }
  
  button {
    margin-right: 10px;
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button.danger {
    background-color: #dc3545;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  table th,
  table td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  
  table th {
    background-color: #f2f2f2;
  }
  </style>
  