# XRPayroll - Idea
An idea to simplify cross-border payments using RLUSD / XRPL to hedge FIAT exchange fees and speedup payments. 

# XBorder-Pay Demo

A Proof of Concept (PoC) for a cross-border HR payments solution built on the XRP Ledger (XRPL). This demo shows how to issue and transfer a token (RLUSD) for payroll or other HR use cases, including optional off-ledger business logic (e.g., limiting total issuance).

## Features

- **Issuer & Recipient Wallets**: Automatically funded via the XRPL Testnet faucet.  
- **Default Ripple**: Optionally enable it on the issuer to facilitate IOU transfers.  
- **Trust Line Creation**: The user “trusts” the issuer’s RLS token.  
- **Send RLS**: Demonstrates how to create and transfer stablecoin-like tokens on XRPL.  
- **Off-Ledger Business Logic**: Example of limiting total issuance (max tokens) on the client side.  

## Prerequisites

- **macOS** (this demo uses Homebrew).  
- **Git**, if you want to clone or version your code.  
- **XRPL Testnet** connectivity (internet connection).

## Quick Start

1. **Clone or Download** this repository.  
2. **Run the Prep Script** to install and configure your environment:  
   ```bash
   chmod +x prep-demo.sh
   ./prep-demo.sh
   ```
   - This script checks for Homebrew, installs/links Node 20, and creates a `XBorder-Pay` directory with an initialized `npm` project plus the `xrpl` library.

3. **Navigate** to the `XBorder-Pay` directory:
   ```bash
   cd XBorder-Pay
   ```
4. **Run** XBorder-Pay
     ```bash
     npm run serve
     ```
   - Adjust commands as needed for your specific setup.

## Script & Directory Structure

- **`prep-demo.sh`**: A Bash script that:
  - Verifies Homebrew is installed.
  - Installs or updates **Node 20** via Homebrew.
  - Creates the `XBorder-Pay` directory and initializes a Node project.
  - Installs the `xrpl` library.

- **`XBorder-Pay`**: The directory automatically created by the prep script.  
  - **`package.json`**: Node.js project metadata.  
  - **`node_modules/`**: Installed dependencies (including `xrpl`).

## License

This demo is released under the **Mozilla Public License, v. 2.0**. A copy of the license text can be found at [mozilla.org/MPL/2.0/](https://mozilla.org/MPL/2.0/).  

Under this license:

- You must **preserve** this notice.  
- You must **disclose** your source code if you distribute a **modified version** of this program.  

## Author

- **Alexander Alten**  
  - GitHub Handle: [2pk03](https://github.com/2pk03)  
