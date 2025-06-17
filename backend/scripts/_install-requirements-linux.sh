#!/bin/bash

set -e

echo "Detected Debian/Ubuntu. Installing Tesseract and Ghostscript with apt..."
apt-get update
apt-get install -y tesseract-ocr ghostscript

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "All dependencies installed."
