#!/bin/bash

# EC2 Application Deployment Script
# This script is used by GitHub Actions to deploy applications on EC2

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
REPO_URL=""
APP_TYPE="nodejs"
APP_DIR="/home/ec2-user/app"
PORT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --repo-url)
            REPO_URL="$2"
            shift 2
            ;;
        --app-type)
            APP_TYPE="$2"
            shift 2
            ;;
        --app-dir)
            APP_DIR="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --repo-url URL    Git repository URL to clone"
            echo "  --app-type TYPE   Application type (nodejs|python|static)"
            echo "  --app-dir DIR     Application directory (default: /home/ec2-user/app)"
            echo "  --port PORT       Custom port to run the application"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$REPO_URL" ]]; then
    print_error "Repository URL is required. Use --repo-url option."
    exit 1
fi

print_status "Starting application deployment..."
print_status "Repository URL: $REPO_URL"
print_status "Application Type: $APP_TYPE"
print_status "Application Directory: $APP_DIR"

# Update system packages
print_status "Updating system packages..."
sudo yum update -y

# Install common dependencies
print_status "Installing common dependencies..."
sudo yum install -y git curl wget

# Clean up any existing deployment
print_status "Cleaning up existing deployment..."
sudo rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone the repository
print_status "Cloning repository..."
if ! git clone "$REPO_URL" .; then
    print_error "Failed to clone repository: $REPO_URL"
    exit 1
fi

print_success "Repository cloned successfully"

# Deploy based on application type
case $APP_TYPE in
    "nodejs")
        print_status "Deploying Node.js application..."
        
        # Install Node.js if not already installed
        if ! command -v node &> /dev/null; then
            print_status "Installing Node.js..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        fi
        
        # Check for package.json
        if [[ ! -f "package.json" ]]; then
            print_error "No package.json found in the repository"
            exit 1
        fi
        
        # Install dependencies
        print_status "Installing Node.js dependencies..."
        npm install
        
        # Set default port if not specified
        if [[ -z "$PORT" ]]; then
            PORT=3000
        fi
        
        # Start the application
        print_status "Starting Node.js application on port $PORT..."
        
        # Kill any existing Node.js processes
        sudo pkill -f "node" || true
        
        # Start the application in background
        export PORT=$PORT
        nohup npm start > "$APP_DIR/app.log" 2>&1 &
        APP_PID=$!
        
        # Wait a moment and check if process is still running
        sleep 5
        if ps -p $APP_PID > /dev/null; then
            print_success "Node.js application started successfully (PID: $APP_PID)"
            print_status "Application logs: $APP_DIR/app.log"
        else
            print_error "Failed to start Node.js application"
            cat "$APP_DIR/app.log"
            exit 1
        fi
        ;;
        
    "python")
        print_status "Deploying Python application..."
        
        # Install Python3 and pip if not already installed
        if ! command -v python3 &> /dev/null; then
            print_status "Installing Python3..."
            sudo yum install -y python3 python3-pip
        fi
        
        # Install dependencies if requirements.txt exists
        if [[ -f "requirements.txt" ]]; then
            print_status "Installing Python dependencies..."
            pip3 install -r requirements.txt --user
        fi
        
        # Set default port if not specified
        if [[ -z "$PORT" ]]; then
            PORT=5000
        fi
        
        # Look for common Python app files
        APP_FILE=""
        if [[ -f "app.py" ]]; then
            APP_FILE="app.py"
        elif [[ -f "main.py" ]]; then
            APP_FILE="main.py"
        elif [[ -f "server.py" ]]; then
            APP_FILE="server.py"
        else
            print_error "No Python application file found (app.py, main.py, or server.py)"
            exit 1
        fi
        
        print_status "Starting Python application: $APP_FILE on port $PORT..."
        
        # Kill any existing Python processes
        sudo pkill -f "python3.*$APP_FILE" || true
        
        # Start the application in background
        export PORT=$PORT
        nohup python3 "$APP_FILE" > "$APP_DIR/app.log" 2>&1 &
        APP_PID=$!
        
        # Wait a moment and check if process is still running
        sleep 5
        if ps -p $APP_PID > /dev/null; then
            print_success "Python application started successfully (PID: $APP_PID)"
            print_status "Application logs: $APP_DIR/app.log"
        else
            print_error "Failed to start Python application"
            cat "$APP_DIR/app.log"
            exit 1
        fi
        ;;
        
    "static")
        print_status "Deploying static website..."
        
        # Install and configure nginx
        if ! command -v nginx &> /dev/null; then
            print_status "Installing nginx..."
            sudo yum install -y nginx
        fi
        
        # Copy files to nginx directory
        print_status "Copying files to nginx directory..."
        sudo cp -r * /var/www/html/
        
        # Start and enable nginx
        print_status "Starting nginx..."
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        # Check nginx status
        if sudo systemctl is-active --quiet nginx; then
            print_success "Static website deployed successfully"
            print_status "Website available on port 80"
        else
            print_error "Failed to start nginx"
            sudo systemctl status nginx
            exit 1
        fi
        ;;
        
    *)
        print_error "Unknown application type: $APP_TYPE"
        print_error "Supported types: nodejs, python, static"
        exit 1
        ;;
esac

# Test the deployment
print_status "Testing deployment..."
sleep 10  # Give the application time to fully start

case $APP_TYPE in
    "nodejs"|"python")
        if curl -f "http://localhost:$PORT" &> /dev/null; then
            print_success "Application is responding on port $PORT"
        else
            print_warning "Application may not be fully ready yet. Check logs: $APP_DIR/app.log"
        fi
        ;;
    "static")
        if curl -f "http://localhost" &> /dev/null; then
            print_success "Static website is accessible"
        else
            print_warning "Website may not be fully ready yet"
        fi
        ;;
esac

print_success "Deployment completed successfully!"

# Print summary
echo
print_status "=== DEPLOYMENT SUMMARY ==="
print_status "Application Type: $APP_TYPE"
print_status "Repository: $REPO_URL"
print_status "Application Directory: $APP_DIR"
case $APP_TYPE in
    "nodejs"|"python")
        print_status "Port: $PORT"
        print_status "Access URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):$PORT"
        print_status "Logs: $APP_DIR/app.log"
        ;;
    "static")
        print_status "Access URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
        ;;
esac
print_status "=========================="
