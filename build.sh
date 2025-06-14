#!/bin/bash

set -e
set -x

EXTENSION_NAME="TruthAndBiasAnalyzer"
BUILD_DIR="build_temp"
DIST_DIR="dist"

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Create build directory
rm -rf "$BUILD_DIR" # Remove if it exists from a previous build
mkdir -p "$BUILD_DIR"

# Copy extension files
cp manifest.json "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp content.js "$BUILD_DIR/"

echo "Extension files copied to $BUILD_DIR"

# Manage extension key
KEY_FILE="key.pem"
if [ ! -f "$KEY_FILE" ]; then
  echo "Generating $KEY_FILE..."
  openssl genrsa -out "$KEY_FILE" 2048
  echo "$KEY_FILE generated. IMPORTANT: Keep this file safe and private. It's crucial for updating your extension."
else
  echo "Using existing $KEY_FILE."
fi

# Pack the extension
echo "Packing extension..."
chromium-browser --pack-extension="$BUILD_DIR" --pack-extension-key="$KEY_FILE"

# Define expected CRX file name based on behavior of chromium-browser
# It typically names the .crx file after the directory it's packing.
PACKED_CRX_BASENAME="${BUILD_DIR}"
PACKED_CRX_FILE="${PACKED_CRX_BASENAME}.crx"
PACKED_PEM_FILE="${PACKED_CRX_BASENAME}.pem" # chromium-browser might create this if key wasn't found before, though we ensure key.pem exists

echo "Extension packing complete."

# Move CRX to dist directory
if [ -f "$PACKED_CRX_FILE" ]; then
  mv "$PACKED_CRX_FILE" "$DIST_DIR/$EXTENSION_NAME.crx"
  echo "Moved $PACKED_CRX_FILE to $DIST_DIR/$EXTENSION_NAME.crx"
else
  echo "ERROR: $PACKED_CRX_FILE not found. Packing might have failed."
  # The script will exit here due to set -e if chromium-browser failed and didn't create the file
fi

# Clean up
echo "Cleaning up..."
rm -rf "$BUILD_DIR"
if [ -f "$PACKED_PEM_FILE" ]; then
  rm "$PACKED_PEM_FILE"
  echo "Removed $PACKED_PEM_FILE."
fi

echo "Build process finished."
