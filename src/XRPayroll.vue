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
    <h1>XRPayroll Dashboard</h1>
    <p><strong>Status:</strong> {{ status }}</p>

    <!-- Admin Navigation Link -->
    <div v-if="isAdmin" class="admin-navigation">
      <router-link to="/user-management">
        <button>Manage Users</button>
      </router-link>
    </div>

    <div class="buttons">
      <!-- 1) Connect & 2) Generate Wallets -->
      <button @click="connectXRPL">1) Connect to Testnet</button>
      <button @click="generateWallets">2) Generate Wallets</button>
      <br /><br />

      <!-- Fund the Issuer again from the faucet (adds more test XRP) -->
      <button @click="fundIssuer" :disabled="!issuerWallet">
        Fund Issuer (Sender)
      </button>
      <!-- Enable Default Ripple on the Issuer -->
      <button @click="enableDefaultRipple" :disabled="!issuerWallet">
        Enable Default Ripple (Issuer)
      </button>
      <br /><br />

      <!-- Create Trust Line -->
      <button @click="createTrustLine" :disabled="!issuerWallet || !userWallet">
        3) Create RLUSD Trust Line
      </button>

      <!-- Amount + Send RLS -->
      <div class="send-section">
        <label for="sendAmount">Amount (RLUSD):</label>
        <input
          id="sendAmount"
          type="number"
          v-model="sendAmount"
          :disabled="!issuerWallet || !userWallet"
        />
        <button @click="sendRLS" :disabled="!issuerWallet || !userWallet">
          4) Send RLUSD
        </button>
      </div>

      <br /><br />

      <!-- Check Issuer RLUSD Balance -->
      <button @click="getIssuerRlsBalance" :disabled="!issuerWallet">
        Get Issuer RLUSD Balance
      </button>
      <!-- Disconnect -->
      <button @click="disconnectXRPL">
        Disconnect
      </button>
    </div>

    <!-- Issuer (Sender) Info -->
    <div class="wallet-info">
      <h3>Issuer (Sender) Wallet</h3>
      <p><strong>Address:</strong> {{ issuerWallet?.classicAddress || 'N/A' }}</p>
      <!-- Show the issuer's RLS balance (can be negative or 0) -->
      <p><strong>RLUSD Balance:</strong> {{ issuerRlsBalance }}</p>
    </div>

    <!-- User (Recipient) Info -->
    <div class="wallet-info">
      <h3>User (Recipient) Wallet</h3>
      <p><strong>Address:</strong> {{ userWallet?.classicAddress || 'N/A' }}</p>
      <!-- Only show the last RLUSD transaction -->
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

    <!-- Employee Records -->
    <section class="employee-records">
      <h2>Employee Records</h2>
      <button @click="loadEmployees" :disabled="!issuerWallet">Refresh Employees</button>
      <table v-if="employeeRecords.length">
  <thead>
    <tr>
      <th>Name</th>
      <th>Employee ID</th>
      <th>Salary (RLUSD)</th>
      <th>Wallet Address</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="emp in employeeRecords" :key="emp.employee_id">
      <td>{{ emp.name }}</td>
      <td>{{ emp.employee_id }}</td>
      <td>{{ emp.salary }}</td>
      <td>{{ emp.wallet_address }}</td>
    </tr>
  </tbody>
</table>
<p v-else>No employee records available.</p>
    </section>

    <!-- Transaction History -->
    <section class="transaction-history">
      <h2>Transaction History</h2>
      <button @click="loadTransactions" :disabled="!issuerWallet">Refresh History</button>
      <table v-if="transactions.length">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Employee ID</th>
            <th>Amount (RLUSD)</th>
            <th>Wallet Address</th>
            <th>Date</th>
            <th>Status</th>
            <th>XRPL TxID</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <td>{{ tx.id }}</td>
            <td>{{ tx.employee_id }}</td>
            <td>{{ tx.amount }}</td>
            <td>{{ tx.wallet_address }}</td>
            <td>{{ new Date(tx.date).toLocaleString() }}</td>
            <td>{{ tx.status }}</td>
            <td>{{ tx.tx_id || 'N/A' }}</td>
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
import { Client } from 'xrpl';
import axios from 'axios';
import jwtDecode from 'jwt-decode'; // Ensure jwt-decode is installed

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
      const decoded = jwtDecode(token);
      user.value.username = decoded.username;
      user.value.role = decoded.role;
      addLog('INFO', `Logged in as ${decoded.username} with role ${decoded.role}`);
    } catch (error) {
      console.error('Error decoding token:', error);
      addLog('ERROR', 'Invalid token. Please log in again.');
    }
  }
}

const isAdmin = computed(() => user.value.role === 'admin');

// ----------------------------------------------------------------------------
// XRPL
// ----------------------------------------------------------------------------
const status = ref('Disconnected from XRPL');
const client = ref(null);

// Issuer & User wallets
const issuerWallet = ref(null);
const userWallet   = ref(null);

// Stable coin code: "RLS"
const CURRENCY_CODE = 'RLS';

// Store the issuer's RLS balance
const issuerRlsBalance = ref('0');
// Store the user's latest transaction
const userLatestTx = ref(null);

// Send amount (default 50 RLS)
const sendAmount = ref('50');

// Define a maximum issuance limit (application-level)
const MAX_RLS_ISSUANCE = 1000;

// ----------------------------------------------------------------------------
// 1) CONNECT
// ----------------------------------------------------------------------------
async function connectXRPL() {
  status.value = 'Connecting...';
  addLog('INFO', 'Connecting to XRPL Testnet...');
  try {
    const xrplClient = new Client('wss://s.altnet.rippletest.net:51233');
    await xrplClient.connect();
    client.value = xrplClient;
    status.value = 'Connected to XRPL Testnet!';
    addLog('INFO', 'Connected to XRPL Testnet.');
  } catch (error) {
    status.value = 'Connection failed!';
    addLog('ERROR', `Failed to connect: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// 2) GENERATE WALLETS
// ----------------------------------------------------------------------------
async function generateWallets() {
  if (!client.value) {
    alert('Connect first!');
    return;
  }
  status.value = 'Generating wallets...';
  addLog('INFO', 'Requesting new wallets from Testnet faucet...');

  try {
    const issuerResp = await client.value.fundWallet();
    const userResp   = await client.value.fundWallet();

    issuerWallet.value = issuerResp.wallet;
    userWallet.value   = userResp.wallet;

    status.value = 'Wallets generated!';
    addLog('INFO', `Issuer: ${issuerWallet.value.classicAddress}`);
    addLog('INFO', `User:   ${userWallet.value.classicAddress}`);

    // Optionally, load employees and transactions if connected
    loadEmployees();
    loadTransactions();
  } catch (error) {
    status.value = 'Wallet generation failed!';
    addLog('ERROR', `Failed to generate wallets: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// 3) FUND ISSUER
// ----------------------------------------------------------------------------
async function fundIssuer() {
  if (!client.value || !issuerWallet.value) {
    alert('Need issuer wallet first!');
    return;
  }
  status.value = 'Funding issuer wallet...';
  addLog('INFO', 'Calling faucet to re-fund issuer wallet...');

  try {
    await client.value.fundWallet({ wallet: issuerWallet.value });
    status.value = 'Issuer funded with more test XRP.';
    addLog('INFO', 'Issuer re-funded successfully.');
  } catch (error) {
    status.value = 'Funding failed!';
    addLog('ERROR', `Exception: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// 4) ENABLE DEFAULT RIPPLE (ISSUER)
// ----------------------------------------------------------------------------
async function enableDefaultRipple() {
  if (!client.value || !issuerWallet.value) {
    alert('Need issuer wallet first!');
    return;
  }
  status.value = 'Enabling Default Ripple...';
  addLog('INFO', 'Sending AccountSet to enable Default Ripple on issuer...');

  const tx = {
    TransactionType: 'AccountSet',
    Account: issuerWallet.value.classicAddress,
    // asfDefaultRipple = 8
    SetFlag: 8
  };

  try {
    const prepared = await client.value.autofill(tx);
    const signed   = issuerWallet.value.sign(prepared);
    const result   = await client.value.submitAndWait(signed.tx_blob);
    const tr       = result.result.meta.TransactionResult;

    if (tr === 'tesSUCCESS') {
      status.value = 'Default Ripple enabled!';
      addLog('INFO', 'Issuer default ripple is ON.');
    } else {
      status.value = 'Failed to enable Default Ripple!';
      addLog('ERROR', `AccountSet failed: ${tr}`);
    }
  } catch (error) {
    status.value = 'AccountSet failed!';
    addLog('ERROR', `Exception: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// 5) CREATE TRUST LINE (USER -> ISSUER) FOR RLS
// ----------------------------------------------------------------------------
async function createTrustLine() {
  if (!client.value || !issuerWallet.value || !userWallet.value) {
    alert('Connect + wallets first!');
    return;
  }
  status.value = 'Creating RLS trust line...';
  addLog('INFO', 'Preparing TrustSet for RLS...');

  const trustSetTx = {
    TransactionType: 'TrustSet',
    Account: userWallet.value.classicAddress,
    LimitAmount: {
      currency: CURRENCY_CODE,
      issuer: issuerWallet.value.classicAddress,
      value: '1000'
    }
  };

  try {
    const prepared = await client.value.autofill(trustSetTx);
    const signed   = userWallet.value.sign(prepared);
    const result   = await client.value.submitAndWait(signed.tx_blob);
    const tr       = result.result.meta.TransactionResult;

    if (tr === 'tesSUCCESS') {
      status.value = 'RLS trust line established!';
      addLog('INFO', 'User now trusts RLS from issuer.');
    } else {
      status.value = 'Trust line creation failed!';
      addLog('ERROR', `TrustSet failed: ${tr}`);
    }
  } catch (error) {
    status.value = 'Trust line creation failed!';
    addLog('ERROR', `Exception: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// 6) SEND RLS (ISSUER -> USER) WITH BUSINESS LOGIC CHECK
// ----------------------------------------------------------------------------
async function sendRLS() {
  if (!client.value || !issuerWallet.value || !userWallet.value) {
    alert('Connect + wallets first!');
    return;
  }

  // 1) Refresh the issuer's RLS balance to see how many tokens are already issued.
  await getIssuerRlsBalance(); // This updates `issuerRlsBalance.value`

  // issuerRlsBalance might be negative (e.g., -300 means 300 tokens in circulation)
  const inCirculation = Math.abs(parseFloat(issuerRlsBalance.value) || 0);
  const requestToSend = parseFloat(sendAmount.value) || 0;

  // 2) Check if inCirculation + requestToSend > MAX_RLS_ISSUANCE
  if (inCirculation + requestToSend > MAX_RLS_ISSUANCE) {
    alert(`Cannot issue more than ${MAX_RLS_ISSUANCE} RLS in total. 
Already in circulation: ${inCirculation}, attempted to send ${requestToSend}.`);
    return;
  }

  // 3) If OK, proceed with Payment transaction
  status.value = `Sending ${sendAmount.value} RLS...`;
  addLog('INFO', `Preparing Payment for ${sendAmount.value} RLS...`);

  const paymentTx = {
    TransactionType: 'Payment',
    Account: issuerWallet.value.classicAddress,
    Destination: userWallet.value.classicAddress,
    Amount: {
      currency: CURRENCY_CODE,
      issuer: issuerWallet.value.classicAddress,
      value: String(sendAmount.value)
    },
    // Use SendMax to avoid partial paths
    SendMax: {
      currency: CURRENCY_CODE,
      issuer: issuerWallet.value.classicAddress,
      value: String(sendAmount.value)
    }
  };

  try {
    const prepared = await client.value.autofill(paymentTx);
    const signed   = issuerWallet.value.sign(prepared);
    const result   = await client.value.submitAndWait(signed.tx_blob);
    const tr       = result.result.meta.TransactionResult;

    if (tr === 'tesSUCCESS') {
      status.value = `Sent ${sendAmount.value} RLS!`;
      addLog('INFO', `Issued ${sendAmount.value} RLS to user.`);

      // Update user's "latest transaction"
      userLatestTx.value = `Received ${sendAmount.value} RLS`;

      // Log transaction in backend
      logTransaction(userWallet.value.classicAddress, sendAmount.value, tr);
    } else {
      status.value = 'Payment failed!';
      addLog('ERROR', `Payment failed: ${tr}`);
    }
  } catch (error) {
    status.value = 'Payment failed!';
    addLog('ERROR', `Exception: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// LOG TRANSACTION TO BACKEND
// ----------------------------------------------------------------------------
async function logTransaction(walletAddress, amount, txId) {
  // Extract employee_id based on wallet_address
  try {
    const resp = await axios.get('/api/employees', {
      params: { wallet_address: walletAddress }
    });
    const employees = resp.data;
    if (employees.length === 0) {
      addLog('WARN', `No employee found for wallet address: ${walletAddress}`);
      return;
    }
    const employee = employees[0];

    // Log transaction via backend
    await axios.post('/api/transactions', {
      employee_id: employee.employee_id,
      amount: amount,
      wallet_address: walletAddress,
      tx_id: txId
    });
    addLog('INFO', `Transaction logged for employee ID ${employee.employee_id}`);
  } catch (error) {
    addLog('ERROR', `Failed to log transaction: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// GET ISSUER RLS BALANCE
// ----------------------------------------------------------------------------
async function getIssuerRlsBalance() {
  if (!client.value || !issuerWallet.value) {
    return;
  }
  status.value = 'Fetching issuer RLS balance...';
  addLog('INFO', 'Requesting account_lines for issuer...');

  try {
    const lines = await client.value.request({
      command: 'account_lines',
      account: issuerWallet.value.classicAddress
    });
    addLog('DEBUG', JSON.stringify(lines));

    const currencyLine = lines.result.lines.find(
      line => line.currency === CURRENCY_CODE
    );
    // e.g., -300 if 300 tokens are in circulation
    issuerRlsBalance.value = currencyLine ? currencyLine.balance : '0';
    status.value = `Issuer RLS balance updated to ${issuerRlsBalance.value}`;
    addLog('INFO', `Issuer RLS: ${issuerRlsBalance.value}`);
  } catch (error) {
    status.value = 'Balance fetch failed!';
    addLog('ERROR', `Failed to get RLS: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// LOAD EMPLOYEE RECORDS
// ----------------------------------------------------------------------------
const employeeRecords = ref([]);

async function loadEmployees() {
  if (!issuerWallet.value) {
    addLog('WARN', 'Issuer wallet is required to fetch employee records.');
    return;
  }

  status.value = 'Loading employee records...';
  addLog('INFO', 'Fetching employee records from backend...');

  try {
    const token = localStorage.getItem('token'); // Use token for authentication if required
    const resp = await axios.get('/api/employees', {
      headers: { Authorization: `Bearer ${token}` },
    });

    employeeRecords.value = resp.data.map((emp) => ({
      name: emp.name,
      employee_id: emp.employee_id,
      salary: emp.salary,
      wallet_address: emp.wallet_address,
    }));

    status.value = 'Employee records loaded.';
    addLog('INFO', `Loaded ${resp.data.length} employees.`);
  } catch (error) {
    status.value = 'Failed to load employees.';
    addLog('ERROR', `Error fetching employees: ${error.message}`);
    console.error('Error fetching employees:', error);
  }
}


// ----------------------------------------------------------------------------
// LOAD TRANSACTION HISTORY
// ----------------------------------------------------------------------------
const transactions = ref([]);

async function loadTransactions() {
  if (!issuerWallet.value) {
    return;
  }
  status.value = 'Loading transaction history...';
  addLog('INFO', 'Fetching transaction history from backend...');

  try {
    const resp = await axios.get('/api/transactions');
    transactions.value = resp.data;
    status.value = 'Transaction history loaded.';
    addLog('INFO', `Loaded ${resp.data.length} transactions.`);
  } catch (error) {
    status.value = 'Failed to load transaction history.';
    addLog('ERROR', `Error fetching transactions: ${error.message}`);
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// DISCONNECT
// ----------------------------------------------------------------------------
function disconnectXRPL() {
  if (client.value) {
    addLog('INFO', 'Disconnecting from XRPL...');
    client.value.disconnect();
    client.value = null;
    status.value = 'Disconnected from XRPL';
  }
}

// ----------------------------------------------------------------------------
// CSV IMPORT/EXPORT FUNCTIONS
// ----------------------------------------------------------------------------
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

    const response = await axios.post('/api/import-csv', formData, {
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

    const response = await axios.get('/api/export-csv', {
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

// ----------------------------------------------------------------------------
// Lifecycle Hook to Load Data on Mount
// ----------------------------------------------------------------------------
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

.buttons button {
  margin: 0 10px 10px 0;
}

.send-section {
  display: inline-block;
  margin-left: 10px;
}

.send-section input {
  width: 100px;
  margin: 0 10px;
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

/* Admin Navigation Styles */
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

/* Admin Interface Styles (Removed Direct Inclusion) */
/*
.admin-interface {
  margin-top: 40px;
  padding: 20px;
  border: 2px solid #007bff;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.admin-interface h2 {
  margin-bottom: 20px;
}
*/
</style>
