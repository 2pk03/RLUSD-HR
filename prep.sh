# XBorder Demo Prep Script
#
# Copyright (c) 2023 Alexander Alten
# GitHub Handle: 2pk03
#
# This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
# If a copy of the MPL was not distributed with this file, You can obtain one at
# http://mozilla.org/MPL/2.0/.
#
# Under the MPL, you must preserve this notice. You must also disclose your source
# code if you distribute a modified version of this program.
#

#!/usr/bin/env bash
set -e

# ------------------------------------------------------------------------------
# 1. Check Homebrew installation
# ------------------------------------------------------------------------------
if ! command -v brew &> /dev/null
then
  echo "Homebrew is not installed! Please install Homebrew from https://brew.sh/ and re-run this script."
  exit 1
else
  echo "Homebrew found!"
fi

# ------------------------------------------------------------------------------
# 2. Install / Upgrade Node 20 via Homebrew
# ------------------------------------------------------------------------------
echo "Installing or upgrading node@20..."
brew update
brew install node@20 || brew upgrade node@20

# Check if there's a "node" linked, and unlink if needed
if brew list --versions node &>/dev/null; then
  echo "Unlinking any existing 'node' brew package..."
  brew unlink node || true
fi

echo "Linking node@20..."
brew link --overwrite node@20

# Verify the Node version
NODE_VERSION=$(node -v || true)
echo "Current Node version is: $NODE_VERSION"
if [[ $NODE_VERSION != v20* ]]; then
  echo "ERROR: Node 20 not detected. Please ensure 'node -v' shows v20.x."
  exit 1
fi

# ------------------------------------------------------------------------------
# 3. Create a new directory 
# ------------------------------------------------------------------------------
DEMO_DIR="XBorder-Pay"
echo "Creating '$DEMO_DIR' folder..."
mkdir -p "$DEMO_DIR"

cd "$DEMO_DIR"

# ------------------------------------------------------------------------------
# 4. Initialize a Node.js project
# ------------------------------------------------------------------------------
echo "Initializing npm project..."
npm init -y

# ------------------------------------------------------------------------------
# 5. Install xrpl library
# ------------------------------------------------------------------------------
echo "Installing xrpl library..."
npm install xrpl

# ------------------------------------------------------------------------------
# Done
# ------------------------------------------------------------------------------
echo ""
echo "====================================================="
echo "Environment setup complete!"
echo "Directory: $(pwd)"
echo "Node version: $(node -v)"
echo "Homebrew: $(brew --version | head -n 1)"
echo "====================================================="
echo "Next Steps:"
echo "1) cd $DEMO_DIR"
echo "2) Write or paste your demo code (e.g., the Vue app or Node script)."
echo "3) npm run serve (if using Vue) or node yourScript.js (for Node)."
echo "====================================================="
