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
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <h1>XRPayroll Dashboard</h1>
      <!-- User Information and Logout Button -->
      <div class="user-info" v-if="user.username">
        <span>Welcome, {{ user.username }} ({{ user.role }})</span>
        <button class="logout-button" @click="handleLogout">Logout</button>
      </div>
    </header>

    <!-- Navigation Links -->
    <nav class="navigation">
     <!-- Role-Based Additional Navigation Links -->
      <div class="additional-links">
        <!-- Admin-Only Links -->
        <div v-if="isAdmin">
          <router-link to="/admin">
            <button :class="{ active: isActive('/admin') }">Admin Panel</button>
          </router-link>
          <router-link to="/trustlines">
            <button :class="{ active: isActive('/trustlines') }">Manage Trust Lines</button>
          </router-link>
          <router-link to="/payments">
            <button :class="{ active: isActive('/payments') }">Handle Payments</button>
          </router-link>
          <router-link to="/register">
            <button :class="{ active: isActive('/register') }">Register User</button>
          </router-link>
        </div>

        <!-- Employee-Only Links -->
        <div v-if="isEmployee">
          <router-link to="/profile">
            <button :class="{ active: isActive('/profile') }">My Profile</button>
          </router-link>
        </div>
      </div>
    </nav>
  
<!-- Buttons Section -->
  <div class="buttons">
    <!-- Admin-Only Buttons -->
    <div v-if="isAdmin">
      <!-- 1) Connect to Testnet -->
      <button @click="connectXRPL" :disabled="connecting">
        1) Connect to Testnet
      </button>
      <br /><br />

      <!-- Fund Issuer -->
      <button @click="fundIssuer" :disabled="!connected || fundingInProgress">
        Fund & Set Default
      </button>
      <br /><br />

      <!-- Disconnect Button -->
      <button @click="disconnectXRPL" :disabled="!connected">
        Disconnect
      </button>
    </div>
  </div>

    <!-- Issuer (Sender) Info -->
    <div class="wallet-info">
      <h3>Issuer (Sender) Wallet</h3>
      <p><strong>Address:</strong> {{ issuerWallet || 'N/A' }}</p>
      <p><strong>RLUSD Balance:</strong> {{ issuerRlsBalance }}</p>
    </div>
    <!-- Employee Records -->
    <section class="employee-records">
      <h2>Employee Records</h2>
      <button @click="loadEmployees" :disabled="!connected">Refresh Employees</button>
      <table v-if="employeeRecords.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Employee ID</th>
            <th>Salary (RLUSD)</th>
            <th>Wallet Address</th>
            <th>Latest TX</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employeeRecords" :key="emp.employee_id">
            <td>{{ emp.name }}</td>
            <td>{{ emp.employee_id }}</td>
            <td>{{ emp.salary }}</td>
            <td>{{ emp.wallet_address || 'No Wallet' }}</td>
            <td>{{ emp.latest_transaction || 'No TX (yet)' }}</td>
            <td>
              <button 
                @click="executeSalary(emp)" 
                :disabled="salaryExecutionInProgress || !connected"
                >
                Execute Salary
          </button>

            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No employee records available.</p>
    </section>
    <!-- User (Recipient) Info -->
    <div class="wallet-info">
      <h3>User (Recipient) Wallet</h3>
      <p><strong>Address:</strong> {{ selectedEmployeeWallet || 'N/A' }}</p>
      <p><strong>Latest RLUSD Transaction:</strong> {{ userLatestTx || 'None' }}</p>
    </div>

    <!-- CSV Import/Export Section -->
    <section class="csv-section">
      <h2>Employee CSV Import/Export</h2>

      <!-- Import CSV -->
      <div class="import-csv">
        <h3>Import Employees via CSV</h3>
        <form @submit.prevent="importCsv">
          <input type="file" accept=".csv" ref="fileInput" />
          <button type="submit">Import CSV</button>
        </form>
      </div>

      <!-- Export CSV -->
      <div class="export-csv">
        <h3>Export Employees to CSV</h3>
        <button @click="exportCsv">Download Employees CSV</button>
      </div>
    </section>

  <!-- Transaction History -->
    <section class="transaction-history">
      <h2>Transaction History</h2>
      <button @click="loadTransactions" :disabled="!connected">Refresh History</button>
      <table v-if="transactions.length">
        <thead>
          <tr>
            <th>Name</th>
    <th>Employee ID</th>
    <th>Salary (RLUSD)</th>
    <th>Wallet Address</th>
    <th>Last Transaction</th>
    <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  <tr v-for="emp in employeeRecords" :key="emp.employee_id">
    <td>{{ emp.name }}</td>
    <td>{{ emp.employee_id }}</td>
    <td>{{ emp.salary }}</td>
    <td>{{ emp.wallet_address || 'No Wallet' }}</td>
    <td>
      <span :class="{'success': emp.last_transaction_status === 'Success', 'failure': emp.last_transaction_status !== 'Success'}">
        {{ formatTransactionDetails(emp) }}
      </span>
    </td>
    <td>
      <button 
        @click="executeSalary(emp)" 
        :disabled="salaryExecutionInProgress || !connected"
      >
        Execute Salary
      </button>
    </td>
  </tr>
</tbody>
      </table>
      <p v-else>No transactions found.</p>
    </section>

    <!-- Log Level Selector -->
    <div class="log-level">
      <label for="logLevelSelect">Log Level:</label>
      <select id="logLevelSelect" v-model="selectedLogLevel">
        <option v-for="level in logLevels" :key="level.value" :value="level.value">
          {{ level.label }}
        </option>
      </select>
    </div>

    <!-- Logs Display -->
    <div class="logs">
      <h3>Logs</h3>
      <div v-for="(log, index) in filteredLogs" :key="index" class="log-line">
        <span :class="log.level">
          {{ log.timestamp }} [{{ log.level }}]: {{ log.message }}
        </span>
      </div>
    </div>

    <!-- Router View for Child Routes -->
    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useRouter, useRoute } from 'vue-router';

// ----------------------------------------------------------------------------
// LOGGING
// ----------------------------------------------------------------------------
const LOG_PRIORITY = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

const logLevels = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO',  value: 'INFO'  },
  { label: 'WARN',  value: 'WARN'  },
  { label: 'ERROR', value: 'ERROR' }
];

const selectedLogLevel = ref('DEBUG');
const logs = ref([]);
const requestWalletInProgress = ref(false);

function formatTransactionDetails(emp) {
  if (!emp.last_transaction) {
    return 'No transaction available';
  }
  const formattedDate = new Date(emp.last_transaction_date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${emp.last_transaction_status} on ${formattedDate}`;
}

function addLog(level, message) {
  logs.value.push({
    level,
    message,
    timestamp: new Date().toLocaleTimeString()
  });
}

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    return LOG_PRIORITY[log.level] >= LOG_PRIORITY[selectedLogLevel.value];
  });
});

// ----------------------------------------------------------------------------
// USER AUTHENTICATION
// ----------------------------------------------------------------------------
const user = ref({
  username: '',
  role: 'employee' // default role
});

function decodeToken() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token); // Ensure jwtDecode is correctly imported
      user.value.username = decoded.username;
      user.value.role = decoded.role;
      addLog('INFO', `Logged in as ${decoded.username} with role ${decoded.role}`);
    } catch (error) {
      console.error('Error decoding token:', error);
      addLog('ERROR', 'Invalid token. Please log in again.');
      alert('Invalid token. Please log in again.');
    }
  } else {
    addLog('WARN', 'No token found. Please log in.');
    alert('No token found. Please log in.');
  }
}

const isAdmin = computed(() => user.value.role === 'admin');
const isEmployee = computed(() => user.value.role === 'employee');

const router = useRouter();
const route = useRoute();

// Function to check if a path is active for styling
const isActive = (path) => {
  return route.path === path;
};

// Logout Handler
function handleLogout() {
  // Clear token and user info from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = { username: '', role: '' };
  addLog('INFO', 'User logged out.');
  // Redirect to Login page
  router.push({ name: 'Login' });
}

// connect defaults
const status = ref('Disconnected from XRPL');
const connected = ref(false);

// Issuer & Selected Employee Wallets
const issuerWallet = ref('');
const selectedEmployeeWallet = ref('');

// Store the issuer's RLS balance
const issuerRlsBalance = ref('');
// Store the user's latest transaction
const userLatestTx = ref(null);

// connect to XRPL Testnet
async function connectXRPL() {
    status.value = 'Connecting to XRPL Testnet...';
    addLog('INFO', 'Initiating connection to XRPL Testnet...');
  
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }

        // Connect to XRPL Testnet
        const connectResp = await axios.post('/api/testnet/connect', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (connectResp.data && connectResp.data.address) {
            issuerWallet.value = connectResp.data.address;
            connected.value = true;
            status.value = 'Connected to XRPL Testnet!';
            addLog('INFO', `Connected to XRPL Testnet with issuer ${issuerWallet.value}`);
            
            // Fetch updated RLUSD balance after connecting
            await getIssuerRlsBalance();
        } else {
            throw new Error('Unexpected response from the server during connection.');
        }
    } catch (error) {
        status.value = 'Connection failed!';
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        addLog('ERROR', `Failed to connect to XRPL Testnet: ${errorMessage}`);
        console.error(error);
        alert(`Connection Error: ${errorMessage}`);
    }
}

// fund issuer wallet, enable default ripple, track funding progress
const fundingInProgress = ref(false);

// Fund Issuer Wallet
async function fundIssuer() {
    fundingInProgress.value = true;
    status.value = 'Funding issuer wallet...';
    addLog('INFO', 'Requesting backend to fund issuer wallet and set default.');

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/testnet/fund-issuer', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });

        status.value = 'Issuer wallet funded successfully.';
        addLog('INFO', response.data.message);
        connected.value = true;

        // Fetch updated balance
        await getIssuerRlsBalance();
    } catch (error) {
        status.value = 'Funding issuer wallet failed.';
        addLog('ERROR', `Error funding issuer wallet: ${error.response?.data?.message || error.message}`);
        console.error(error);
    } finally {
        fundingInProgress.value = false;
    }

  // Enable Default Ripple
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/testnet/enable-ripple', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    status.value = 'Default enabled.';
    addLog('INFO', response.data.message);
    connected.value = true; // Set connected to true after funding
  } catch (error) {
    status.value = 'Something went wrong.';
    addLog('ERROR', `Error enabling default: ${error.response?.data?.message || error.message}`);
    console.error(error);
  } finally {
    fundingInProgress.value = false;
  }
}

// Track salary execution progress
const salaryExecutionInProgress = ref(false);

/// Execute Salary Workflow: Create Wallet, Trust Line, and Send Salary
async function executeSalary(employee) {
    if (!employee || !employee.employee_id) {
        alert('Invalid employee information.');
        return;
    }

    salaryExecutionInProgress.value = true;
    status.value = `Executing salary for employee: ${employee.name}...`;
    addLog('INFO', `Initiating salary execution for employee: ${employee.name}`);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }

        // Step 1: Ensure Wallet Exists and Is Active
        if (!employee.wallet_address) {
            await createWalletForEmployee(employee, token);
        } else {
            const isActive = await checkWalletActivation(employee.wallet_address, token);
            if (!isActive) {
                await fundWalletForActivation(employee.wallet_address, token);
            }
        }

        // Step 2: Establish Trust Line (if not already established)
        const walletSeedResponse = await axios.post(
            '/api/testnet/employees/get-wallet-seed',
            { employeeID: employee.employee_id },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const employeeWalletSeed = walletSeedResponse.data.walletSeed;
        if (!employeeWalletSeed) {
            throw new Error('Employee wallet seed is not available.');
        }

        await axios.post(
            '/api/testnet/trustlines/create',
            {
                employeeWalletSeed,
                issuerAddress: issuerWallet.value,
                limit: '1000000', // Generic trust line limit
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        addLog('INFO', `Trust line established for ${employee.wallet_address}`);

        // Step 3: Send Salary
        const salaryAmount = parseFloat(employee.salary) || 0;
        if (salaryAmount <= 0) {
            throw new Error('Invalid salary amount.');
        }

        await axios.post(
            '/api/testnet/payments/send',
            { employeeWallet: employee.wallet_address, amount: salaryAmount },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        addLog('INFO', `Salary of ${salaryAmount} RLUSD sent to ${employee.wallet_address}`);

        // Step 4: Refresh Issuer Balance
        await getIssuerRlsBalance();

        alert(`Salary executed successfully for ${employee.name}`);
    } catch (error) {
        status.value = 'Salary execution failed!';
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        addLog('ERROR', `Failed to execute salary for ${employee.name}: ${errorMessage}`);
        alert(`Error: ${errorMessage}`);
    } finally {
        salaryExecutionInProgress.value = false;
        await loadEmployees(); // Refresh the employee list
    }
}

// Helper Function: Create Wallet for Employee
async function createWalletForEmployee(employee, token) {
    requestWalletInProgress.value = true;
    status.value = `Creating wallet for ${employee.name}...`;
    addLog('INFO', `Creating wallet for employee ID: ${employee.employee_id}`);

    try {
        const walletResponse = await axios.post(
            '/api/testnet/employees/request-wallet',
            { employeeID: employee.employee_id },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        employee.wallet_address = walletResponse.data.walletAddress;
        addLog('INFO', `Wallet created: ${employee.wallet_address}`);
        status.value = `Wallet created successfully for ${employee.name}`;

        await fundWalletForActivation(employee.wallet_address, token);
    } catch (error) {
        throw new Error(`Failed to create wallet: ${error.response?.data?.message || error.message}`);
    } finally {
        requestWalletInProgress.value = false;
    }
}

// Helper Function: Check Wallet Activation
async function checkWalletActivation(walletAddress, token) {
    status.value = `Checking activation for wallet: ${walletAddress}...`;
    addLog('INFO', `Checking activation status for wallet: ${walletAddress}`);

    try {
        const response = await axios.post(
            '/api/testnet/wallet/verify',
            { walletAddress },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.activated) {
            addLog('INFO', `Wallet is active: ${walletAddress}`);
            return true;
        }
    } catch (error) {
        if (error.response?.data?.error === 'actNotFound') {
            addLog('WARN', `Wallet not active: ${walletAddress}`);
            return false;
        }
        throw new Error(`Error verifying wallet activation: ${error.response?.data?.message || error.message}`);
    }
    return false;
}

// Helper Function: Fund Wallet for Activation
async function fundWalletForActivation(walletAddress, token) {
    status.value = `Funding wallet for activation: ${walletAddress}...`;
    addLog('INFO', `Funding wallet: ${walletAddress}`);

    try {
        await axios.post(
            '/api/testnet/fund-wallet',
            { walletAddress },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        addLog('INFO', `Wallet funded: ${walletAddress}`);
    } catch (error) {
        throw new Error(`Failed to fund wallet: ${error.response?.data?.message || error.message}`);
    }
}

// get issuer RLS balance
async function getIssuerRlsBalance() {
    if (!connected.value) {
        return;
    }
    status.value = 'Fetching issuer RLS balance...';
    addLog('INFO', 'Requesting issuer RLS balance from backend...');
  
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }

        const resp = await axios.get('/api/testnet/issuer/balance', {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Balance is returned in drops; divide by 1,000,000 to convert to XRP
        const balanceInXRP = parseFloat(resp.data.balance) / 1_000_000;

        issuerRlsBalance.value = `${balanceInXRP.toFixed(6)} XRP`;
        status.value = `Issuer RLS balance: ${issuerRlsBalance.value}`;
        addLog('INFO', `Issuer RLS Balance: ${issuerRlsBalance.value}`);
    } catch (error) {
        status.value = 'Failed to fetch issuer RLS balance!';
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        addLog('ERROR', `Failed to get issuer RLS balance: ${errorMessage}`);
        console.error(error);
        alert(`Balance Fetch Error: ${errorMessage}`);
    }
}

// load employee records
const employeeRecords = ref([]);

async function loadEmployees() {
  if (!connected.value) {
    addLog('WARN', 'XRPL not connected. Connect first to load employees.');
    return;
  }

  status.value = 'Loading employee records...';
  addLog('INFO', 'Fetching employee records from backend...');

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const resp = await axios.get('/api/testnet/employees', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const employees = resp.data.employees;

    // Fetch the latest transaction for each employee
    for (const employee of employees) {
      const latestTransaction = await fetchLatestTransaction(employee.employee_id);
      employee.latest_transaction = latestTransaction
        ? `${latestTransaction.status} on ${latestTransaction.date}`
        : 'No transaction available';
    }

    employeeRecords.value = employees;
    status.value = 'Employee records loaded.';
    addLog('INFO', `Loaded ${employeeRecords.value.length} employees.`);
  } catch (error) {
    status.value = 'Failed to load employees.';
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    addLog('ERROR', `Error fetching employees: ${errorMessage}`);
    console.error('Error fetching employees:', error);
    alert(`Load Employees Error: ${errorMessage}`);
  }
}

// fetch latest transaction for an employee
async function fetchLatestTransaction(employeeID) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const resp = await axios.get(`/api/testnet/employee/${employeeID}/latest-transaction`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return resp.data.transaction;
  } catch (error) {
    addLog('ERROR', `Error fetching latest transaction for employee ${employeeID}: ${error.message}`);
    console.error(error);
    return null;
  }
}

// load transaction history
const transactions = ref([]);

async function loadTransactions() {
  if (!connected.value) {
    addLog('WARN', 'XRPL not connected. Connect first to load transactions.');
    return;
  }

  status.value = 'Loading transaction history...';
  addLog('INFO', 'Fetching all transaction history from backend...');

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const resp = await axios.get('/api/testnet/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    transactions.value = resp.data.transactions;
    status.value = 'Transaction history loaded.';
    addLog('INFO', `Loaded ${transactions.value.length} transactions.`);
  } catch (error) {
    status.value = 'Failed to load transaction history.';
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    addLog('ERROR', `Error fetching transactions: ${errorMessage}`);
    console.error(error);
    alert(`Load Transactions Error: ${errorMessage}`);
  }
}

// disconnect from XRPL
function disconnectXRPL() {
  if (connected.value) {
    addLog('INFO', 'Disconnected from XRPL Testnet.');
    connected.value = false;
    issuerWallet.value = '';
    issuerRlsBalance.value = '0';
    selectedEmployeeWallet.value = '';
    userLatestTx.value = null;
    status.value = 'Disconnected from XRPL';
  }
}

// import/export CSV
const fileInput = ref(null);

async function importCsv() {
  const file = fileInput.value.files[0];
  if (!file) {
    alert('Please select a CSV file to import.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication token not found. Please log in.');
      return;
    }

    const response = await axios.post('/api/csv/import', formData, { // Ensure the endpoint matches
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    alert(response.data.message);
    addLog('INFO', response.data.message);

    // Refresh employee records
    loadEmployees();
    loadTransactions();
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message);
      addLog('ERROR', error.response.data.message);
    } else {
      alert('Failed to import CSV.');
      addLog('ERROR', `Failed to import CSV: ${error.message}`);
    }
    console.error(error);
  }
}

async function exportCsv() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication token not found. Please log in.');
      return;
    }

    const response = await axios.get('/api/csv/export', { // Ensure this endpoint exists
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob' // Important for file downloads
    });

    // Create a URL for the blob and trigger a download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employees.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    addLog('INFO', 'Employees CSV exported successfully.');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message);
      addLog('ERROR', error.response.data.message);
    } else {
      alert('Failed to export CSV.');
      addLog('ERROR', `Failed to export CSV: ${error.message}`);
    }
    console.error(error);
  }
}

// lifecycle hooks
onMounted(() => {
  decodeToken();
  loadEmployees();
  loadTransactions();
});
</script>


<style scoped>
.container {
  max-width: 800px;
  margin: 40px auto;
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-button {
  padding: 5px 10px;
  background-color: #cc0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #990000;
}

.navigation {
  margin: 20px 0;
}

.navigation button {
  margin-right: 10px;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.navigation button.active,
.navigation button:hover {
  background-color: #0056b3;
}

.admin-navigation {
  margin-top: 20px;
}

.admin-navigation button {
  padding: 10px 20px;
  background-color: #f0ad4e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.admin-navigation button:hover {
  background-color: #ec971f;
}

.additional-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.additional-links button {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.additional-links button.active,
.additional-links button:hover {
  background-color: #218838;
}

.buttons button {
  margin: 0 10px 10px 0;
}

.wallet-info {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}

.csv-section {
  margin-top: 30px;
  padding: 10px;
  border: 1px solid #ccc;
}

.csv-section h2 {
  margin-bottom: 10px;
}

.import-csv, .export-csv {
  margin-bottom: 20px;
}

.employee-records, .transaction-history {
  margin-top: 30px;
  padding: 10px;
  border: 1px solid #ccc;
}

.employee-records h2, .transaction-history h2 {
  margin-bottom: 10px;
}

.employee-records table, .transaction-history table {
  width: 100%;
  border-collapse: collapse;
}

.employee-records th, .employee-records td,
.transaction-history th, .transaction-history td {
  border: 1px solid #ddd;
  padding: 8px;
}

.employee-records th, .transaction-history th {
  background-color: #f2f2f2;
  text-align: left;
}

.log-level {
  margin: 20px 0 10px;
}

.logs {
  border: 1px solid #ccc;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.log-line {
  font-family: monospace;
  margin: 2px 0;
}

.log-line .DEBUG {
  color: #999;
}

.log-line .INFO {
  color: #0066cc;
}

.log-line .WARN {
  color: #ffa500;
}

.log-line .ERROR {
  color: #cc0000;
}

.success {
  color: green;
  font-weight: bold;
}

.failure {
  color: red;
  font-weight: bold;
}

</style>
