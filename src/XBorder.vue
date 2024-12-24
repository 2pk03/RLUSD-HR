/*
 * RLUSD Cross-Boder Employee Demo
 * 
 * Copyright (c) 2024 Alexander Alten (GitHub: 2pk03)
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
    <h1>XRPL XBorder Salary Demo</h1>
    <p><strong>Status:</strong> {{ status }}</p>

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

      <!-- Check Issuer RLS Balance -->
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
      <!-- Only show the last RLS transaction -->
      <p><strong>Latest RLUSD Transaction:</strong> {{ userLatestTx || 'None' }}</p>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Client } from 'xrpl'

// ----------------------------------------------------------------------------
// LOGGING
// ----------------------------------------------------------------------------
const LOG_PRIORITY = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
}

const logLevels = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO',  value: 'INFO'  },
  { label: 'WARN',  value: 'WARN'  },
  { label: 'ERROR', value: 'ERROR' }
]

const selectedLogLevel = ref('DEBUG')
const logs = ref([])

function addLog(level, message) {
  logs.value.push({
    level,
    message,
    timestamp: new Date().toLocaleTimeString()
  })
}

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    return LOG_PRIORITY[log.level] >= LOG_PRIORITY[selectedLogLevel.value]
  })
})

// ----------------------------------------------------------------------------
// XRPL
// ----------------------------------------------------------------------------
const status = ref('Disconnected from XRPL')
const client = ref(null)

// Issuer & User wallets
const issuerWallet = ref(null)
const userWallet   = ref(null)

// Minimal stable coin code: "RLS"
const CURRENCY_CODE = 'RLS'

// Store the issuer's RLS balance
const issuerRlsBalance = ref('0')
// Store the user's latest transaction
const userLatestTx = ref(null)

// Send amount (default 50 RLS)
const sendAmount = ref('50')

// Define a maximum issuance limit (application-level)
const MAX_RLS_ISSUANCE = 1000

// ----------------------------------------------------------------------------
// 1) CONNECT
// ----------------------------------------------------------------------------
async function connectXRPL() {
  status.value = 'Connecting...'
  addLog('INFO', 'Connecting to XRPL Testnet...')
  try {
    const xrplClient = new Client('wss://s.altnet.rippletest.net:51233')
    await xrplClient.connect()
    client.value = xrplClient
    status.value = 'Connected to XRPL Testnet!'
    addLog('INFO', 'Connected to XRPL Testnet.')
  } catch (error) {
    status.value = 'Connection failed!'
    addLog('ERROR', `Failed to connect: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// 2) GENERATE WALLETS
// ----------------------------------------------------------------------------
async function generateWallets() {
  if (!client.value) {
    alert('Connect first!')
    return
  }
  status.value = 'Generating wallets...'
  addLog('INFO', 'Requesting new wallets from Testnet faucet...')

  try {
    const issuerResp = await client.value.fundWallet()
    const userResp   = await client.value.fundWallet()

    issuerWallet.value = issuerResp.wallet
    userWallet.value   = userResp.wallet

    status.value = 'Wallets generated!'
    addLog('INFO', `Issuer: ${issuerWallet.value.classicAddress}`)
    addLog('INFO', `User:   ${userWallet.value.classicAddress}`)
  } catch (error) {
    status.value = 'Wallet generation failed!'
    addLog('ERROR', `Failed to generate wallets: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// FUND ISSUER
// ----------------------------------------------------------------------------
async function fundIssuer() {
  if (!client.value || !issuerWallet.value) {
    alert('Need issuer wallet first!')
    return
  }
  status.value = 'Funding issuer wallet...'
  addLog('INFO', 'Calling faucet to re-fund issuer wallet...')

  try {
    await client.value.fundWallet({ wallet: issuerWallet.value })
    status.value = 'Issuer funded with more test XRP.'
    addLog('INFO', 'Issuer re-funded successfully.')
  } catch (error) {
    status.value = 'Funding failed!'
    addLog('ERROR', `Exception: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// ENABLE DEFAULT RIPPLE (ISSUER)
// ----------------------------------------------------------------------------
async function enableDefaultRipple() {
  if (!client.value || !issuerWallet.value) {
    alert('Need issuer wallet first!')
    return
  }
  status.value = 'Enabling Default Ripple...'
  addLog('INFO', 'Sending AccountSet to enable Default Ripple on issuer...')

  const tx = {
    TransactionType: 'AccountSet',
    Account: issuerWallet.value.classicAddress,
    // asfDefaultRipple = 8
    SetFlag: 8
  }

  try {
    const prepared = await client.value.autofill(tx)
    const signed   = issuerWallet.value.sign(prepared)
    const result   = await client.value.submitAndWait(signed.tx_blob)
    const tr       = result.result.meta.TransactionResult

    if (tr === 'tesSUCCESS') {
      status.value = 'Default Ripple enabled!'
      addLog('INFO', 'Issuer default ripple is ON.')
    } else {
      status.value = 'Failed to enable Default Ripple!'
      addLog('ERROR', `AccountSet failed: ${tr}`)
    }
  } catch (error) {
    status.value = 'AccountSet failed!'
    addLog('ERROR', `Exception: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// 3) CREATE TRUST LINE (USER -> ISSUER) FOR RLS
// ----------------------------------------------------------------------------
async function createTrustLine() {
  if (!client.value || !issuerWallet.value || !userWallet.value) {
    alert('Connect + wallets first!')
    return
  }
  status.value = 'Creating RLS trust line...'
  addLog('INFO', 'Preparing TrustSet for RLS...')

  const trustSetTx = {
    TransactionType: 'TrustSet',
    Account: userWallet.value.classicAddress,
    LimitAmount: {
      currency: CURRENCY_CODE,
      issuer: issuerWallet.value.classicAddress,
      value: '1000'
    }
  }

  try {
    const prepared = await client.value.autofill(trustSetTx)
    const signed   = userWallet.value.sign(prepared)
    const result   = await client.value.submitAndWait(signed.tx_blob)
    const tr       = result.result.meta.TransactionResult

    if (tr === 'tesSUCCESS') {
      status.value = 'RLS trust line established!'
      addLog('INFO', 'User now trusts RLS from issuer.')
    } else {
      status.value = 'Trust line creation failed!'
      addLog('ERROR', `TrustSet failed: ${tr}`)
    }
  } catch (error) {
    status.value = 'Trust line creation failed!'
    addLog('ERROR', `Exception: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// 4) SEND RLS (ISSUER -> USER) WITH BUSINESS LOGIC CHECK
// ----------------------------------------------------------------------------
async function sendRLS() {
  if (!client.value || !issuerWallet.value || !userWallet.value) {
    alert('Connect + wallets first!')
    return
  }

  // 1) Refresh the issuer's RLS balance to see how many tokens are already issued.
  await getIssuerRlsBalance() // This updates `issuerRlsBalance.value`

  // issuerRlsBalance might be negative (e.g., -300 means 300 tokens in circulation)
  const inCirculation = Math.abs(parseFloat(issuerRlsBalance.value) || 0)
  const requestToSend = parseFloat(sendAmount.value) || 0

  // 2) Check if inCirculation + requestToSend > MAX_RLS_ISSUANCE
  if (inCirculation + requestToSend > MAX_RLS_ISSUANCE) {
    alert(`Cannot issue more than ${MAX_RLS_ISSUANCE} RLS in total. 
Already in circulation: ${inCirculation}, attempted to send ${requestToSend}.`)
    return
  }

  // 3) If OK, proceed with Payment transaction
  status.value = `Sending ${sendAmount.value} RLS...`
  addLog('INFO', `Preparing Payment for ${sendAmount.value} RLS...`)

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
  }

  try {
    const prepared = await client.value.autofill(paymentTx)
    const signed   = issuerWallet.value.sign(prepared)
    const result   = await client.value.submitAndWait(signed.tx_blob)
    const tr       = result.result.meta.TransactionResult

    if (tr === 'tesSUCCESS') {
      status.value = `Sent ${sendAmount.value} RLS!`
      addLog('INFO', `Issued ${sendAmount.value} RLS to user.`)

      // Update user's "latest transaction"
      userLatestTx.value = `Received ${sendAmount.value} RLS`
    } else {
      status.value = 'Payment failed!'
      addLog('ERROR', `Payment failed: ${tr}`)
    }
  } catch (error) {
    status.value = 'Payment failed!'
    addLog('ERROR', `Exception: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// GET ISSUER RLS BALANCE
// ----------------------------------------------------------------------------
async function getIssuerRlsBalance() {
  if (!client.value || !issuerWallet.value) {
    return
  }
  status.value = 'Fetching issuer RLS balance...'
  addLog('INFO', 'Requesting account_lines for issuer...')

  try {
    const lines = await client.value.request({
      command: 'account_lines',
      account: issuerWallet.value.classicAddress
    })
    addLog('DEBUG', JSON.stringify(lines))

    const currencyLine = lines.result.lines.find(
      line => line.currency === CURRENCY_CODE
    )
    // e.g., -300 if 300 tokens are in circulation
    issuerRlsBalance.value = currencyLine ? currencyLine.balance : '0'
    status.value = `Issuer RLS balance updated to ${issuerRlsBalance.value}`
    addLog('INFO', `Issuer RLS: ${issuerRlsBalance.value}`)
  } catch (error) {
    status.value = 'Balance fetch failed!'
    addLog('ERROR', `Failed to get RLS: ${error.message}`)
    console.error(error)
  }
}

// ----------------------------------------------------------------------------
// DISCONNECT
// ----------------------------------------------------------------------------
function disconnectXRPL() {
  if (client.value) {
    addLog('INFO', 'Disconnecting from XRPL...')
    client.value.disconnect()
    client.value = null
    status.value = 'Disconnected from XRPL'
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
  font-family: sans-serif;
}

.buttons button {
  margin: 0 10px 10px 0;
}

.send-section {
  display: inline-block;
  margin-left: 10px;
}

.send-section input {
  width: 80px;
  margin: 0 10px;
}

.wallet-info {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}

.log-level {
  margin: 20px 0 10px;
}

.logs {
  border: 1px solid #ccc;
  padding: 10px;
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
</style>
