#!/bin/bash

# Node.js Installation Helper for Amazon Linux 2
# This script provides multiple methods to install Node.js

set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

install_nodejs() {
    print_status "Installing Node.js 16 (Amazon Linux 2 compatible)..."
    
    # Method 1: Try NVM first (most reliable)
    if ! command -v node &> /dev/null; then
        print_status "Method 1: Installing via NVM..."
        
        # Install NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        
        # Load NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        if command -v nvm &> /dev/null; then
            nvm install 16.20.2  # LTS version compatible with Amazon Linux 2
            nvm use 16.20.2
            nvm alias default 16.20.2
            print_success "Node.js 16.20.2 installed via NVM"
            return 0
        fi
    fi
    
    # Method 2: Official binary download (Node.js 16)
    if ! command -v node &> /dev/null; then
        print_status "Method 2: Installing Node.js 16 binary (GLIBC compatible)..."
        
        cd /tmp
        wget https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.xz
        tar -xf node-v16.20.2-linux-x64.tar.xz
        
        # Create local bin directory if it doesn't exist
        mkdir -p $HOME/bin
        
        # Copy binaries
        cp node-v16.20.2-linux-x64/bin/* $HOME/bin/
        
        # Add to PATH
        echo 'export PATH="$HOME/bin:$PATH"' >> $HOME/.bashrc
        export PATH="$HOME/bin:$PATH"
        
        # Clean up
        rm -rf node-v16.20.2-linux-x64*
        
        if command -v node &> /dev/null; then
            print_success "Node.js 16.20.2 installed via binary download"
            return 0
        fi
    fi
    
    # Method 3: Amazon Linux Extras (Node.js 14)
    if ! command -v node &> /dev/null; then
        print_status "Method 3: Installing via Amazon Linux Extras..."
        
        # Enable nodejs14 from amazon-linux-extras
        sudo amazon-linux-extras enable nodejs14 || true
        sudo yum install -y nodejs npm || true
        
        if command -v node &> /dev/null; then
            print_success "Node.js installed via Amazon Linux Extras"
            return 0
        fi
    fi
    
    # Method 4: Build from source (last resort - Node.js 16)
    if ! command -v node &> /dev/null; then
        print_status "Method 4: Building Node.js 16 from source..."
        
        # Install build dependencies
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y python3
        
        cd /tmp
        wget https://nodejs.org/dist/v16.20.2/node-v16.20.2.tar.gz
        tar -xzf node-v16.20.2.tar.gz
        cd node-v16.20.2
        
        ./configure --prefix=$HOME
        make -j$(nproc)
        make install
        
        # Add to PATH
        echo 'export PATH="$HOME/bin:$PATH"' >> $HOME/.bashrc
        export PATH="$HOME/bin:$PATH"
        
        cd /
        rm -rf /tmp/node-v16.20.2*
        
        if command -v node &> /dev/null; then
            print_success "Node.js 16 built and installed from source"
            return 0
        fi
    fi
    
    print_error "All Node.js installation methods failed"
    return 1
}

# Run the installation
install_nodejs

# Verify installation
if command -v node &> /dev/null; then
    print_success "Node.js installation verified"
    print_status "Node.js version: $(node --version)"
    print_status "NPM version: $(npm --version)"
else
    print_error "Node.js installation failed"
    exit 1
fi
