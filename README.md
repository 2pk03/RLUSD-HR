# RLUSD-HR
An idea to simplify cross-border payments using RLUSD / XRPL to hedge FIAT exchange fees and speedup payments 

# XRPL RLUSD PoC

A simple Proof of Concept (PoC) demonstrating how to issue and transfer a custom token (“RLUSD”) on the XRP Ledger using the **xrpl** JavaScript library.

## Overview

This PoC:
1. Connects to the **XRPL Testnet**.  
2. Generates and funds two wallets (an **issuer** and a **user**) via the **Testnet faucet**.  
3. Creates a **trust line** from the user to the issuer for the RLUSD token.  
4. Sends **RLUSD** from the issuer to the user.  
5. Queries the user’s balance to confirm receipt of RLUSD.

## Prerequisites

- **Node.js** (v12+ recommended)
- Installed dependencies:
  ```bash
  npm install xrpl
  ```

## Usage

1. **Clone** or download this repository.  
2. **Navigate** to the project folder:
   ```bash
   cd xrpl-rlusd-poc
   ```
3. **Install** dependencies:
   ```bash
   npm install xrpl
   ```
4. **Run** the PoC:
   ```bash
   node poc.js
   ```

## Expected Output

- Logs showing a successful connection to the XRPL testnet.  
- Newly generated addresses for the **issuer** and **user**.  
- Confirmation of the **TrustSet** transaction success.  
- Confirmation of the **Payment** transaction success (sending RLUSD).  
- Display of the user’s RLUSD balance.  
- A final disconnect message from XRPL.

## Notes

- This is a **Testnet** demonstration only. Real XRP is **not** used, and all funds are test funds.  
- For **production**, you’ll need to handle secrets securely, manage transaction fees, and handle off-ramping through an exchange or payment gateway if converting RLUSD to fiat currency.
