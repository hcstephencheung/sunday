#!/bin/bash

set -e

echo "Detected macOS. Installing Tesseract and Ghostscript with Homebrew..."
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
    exit 1
fi
brew install tesseract ghostscript

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "All dependencies installed."
