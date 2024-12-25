# XRPayroll - Idea
An idea to simplify cross-border payments using RLUSD / XRPL to hedge FIAT exchange fees and speedup payments. 

# Demo

A Proof of Concept (PoC) for a cross-border HR payments solution built on the XRP Ledger (XRPL). This demo shows how to issue and transfer a token (RLUSD) for payroll or other HR use cases, including optional off-ledger business logic (e.g., limiting total issuance).

## Features

- **Issuer & Recipient Wallets**: Automatically funded via the XRPL Testnet faucet.  
- **Default Ripple**: Optionally enable it on the issuer to facilitate IOU transfers.  
- **Trust Line Creation**: The user “trusts” the issuer’s RLS token.  
- **Send RLS**: Demonstrates how to create and transfer stablecoin-like tokens on XRPL.  
- **Off-Ledger Business Logic**: Example of limiting total issuance (max tokens) on the client side.
- **User Management**: Simple user management interface  

## Prerequisites

- **macOS** (this demo uses Homebrew).  
- **Git**, if you want to clone or version your code.  
- **XRPL Testnet** connectivity (internet connection).
```bash
     npm install xrpl express cors multer csv-parser json2csv sqlite3 concurrently axios dotenv jsonwebtoken fs bcrypt jwt-decode express-validator vue-router@4 helmet morgan express-rate-limit
```

## Quick Start
```bash
     npm run dev
```
   - Adjust commands as needed for your specific setup.

## License

This demo is released under the **Mozilla Public License, v. 2.0**. A copy of the license text can be found at [mozilla.org/MPL/2.0/](https://mozilla.org/MPL/2.0/).  

Under this license:

- You must **preserve** this notice.  
- You must **disclose** your source code if you distribute a **modified version** of this program.  

## Author

- **Alexander Alten**  
  - GitHub Handle: [2pk03](https://github.com/2pk03)  
