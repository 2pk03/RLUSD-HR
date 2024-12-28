# XRPayroll
Simplify cross-border payments using Ripple's Stablecoin RLUSD via XRPL to hedge FIAT exchange fees and speedup payments. AGI research project, approx 70% Written with AI (o1 from OpenAI).
The app uses routes and can be adopted to any blockchain by implementing a new route. Right now it supports XRPL.

## Features

- **Issuer & Recipient Wallets**: Automatically funded via the XRPL Testnet faucet.  
- **Trust Line Creation**: The user “trusts” the issuer’s RLS token.  
- **Send Tokens**: Demonstrates how to create and transfer stablecoin-like tokens on XRPL.  
- **User Management**: Simple user management interface 
- **100% API**: Backend systems with routing mechanism, API 
- **RBAC**: Role-basd access, simple yet
- **SQLLite**: SQL backend, tracking of wallets and funding to ensure persistency  

## Prerequisites
```bash
     npm install xrpl express cors multer csv-parser json2csv sqlite3 concurrently axios dotenv jsonwebtoken fs bcrypt jwt-decode express-validator vue-router@4 helmet morgan express-rate-limit express-sslify sequelize body-parser
```

## Quick Start
```bash
     npm run dev
```
 
 Go to ```http://localhost:8080```; password ```admin/adminpassword```

## License

This demo is released under the **Mozilla Public License, v. 2.0**. A copy of the license text can be found at [mozilla.org/MPL/2.0/](https://mozilla.org/MPL/2.0/).  

Under this license:

- You must **preserve** this notice.  
- You must **disclose** your source code if you distribute a **modified version** of this program.  

## Author

- **Alexander Alten**  
  - GitHub Handle: [2pk03](https://github.com/2pk03)  
