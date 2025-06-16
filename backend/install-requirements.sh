#!/bin/bash

set -e

echo "Detecting OS..."
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    echo "Detected macOS."
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
    bash "$(dirname "$0")/_install-requirements-macos.sh"
elif [ "$OS" = "Linux" ]; then
    if [ -f /etc/debian_version ]; then
        echo "Detected Debian/Ubuntu."
        bash "$(dirname "$0")/_install-requirements-linux.sh"
    else
        echo "Non-Debian Linux detected. Please install Tesseract and Ghostscript manually."
        exit 1
    fi
else
    echo "Unsupported OS: $OS. Please install Tesseract and Ghostscript manually."
    exit 1
fi

echo "All dependencies installed."
