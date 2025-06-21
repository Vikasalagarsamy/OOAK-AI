#!/bin/bash

# OOAK Call Manager Pro - Deployment Script
# This script automates the deployment process for the OOAK Call Manager Pro app

set -e  # Exit on any error

# Colors for output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 16 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to check device connection
check_device_connection() {
    print_status "Checking for connected devices..."
    
    if command_exists adb; then
        DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
        if [ "$DEVICES" -gt 0 ]; then
            print_success "Found $DEVICES connected device(s)"
            adb devices
            return 0
        else
            print_warning "No Android devices found. Please connect your device and enable USB debugging"
            return 1
        fi
    else
        print_warning "ADB not found. Please install Android SDK platform tools"
        return 1
    fi
}

# Function to start development server
start_dev_server() {
    print_status "Starting Expo development server..."
    
    if command_exists expo; then
        expo start --clear
    else
        print_status "Expo CLI not found globally, using npx..."
        npx expo start --clear
    fi
}

# Function to build for Android
build_android() {
    print_status "Building Android APK..."
    
    if command_exists expo; then
        expo build:android --type apk
    else
        npx expo build:android --type apk
    fi
    
    print_success "Android build completed"
}

# Function to deploy to connected device
deploy_to_device() {
    print_status "Deploying to connected Android device..."
    
    if check_device_connection; then
        if command_exists expo; then
            expo start --android
        else
            npx expo start --android
        fi
    else
        print_error "Cannot deploy - no device connected"
        return 1
    fi
}

# Function to setup development environment
setup_dev_environment() {
    print_status "Setting up development environment..."
    
    # Check prerequisites
    if ! check_node_version; then
        exit 1
    fi
    
    # Install global dependencies if needed
    if ! command_exists expo; then
        print_status "Installing Expo CLI globally..."
        npm install -g expo-cli
    fi
    
    # Install project dependencies
    install_dependencies
    
    print_success "Development environment setup complete"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check TypeScript compilation
    print_status "Checking TypeScript compilation..."
    if npx tsc --noEmit; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
    
    # Check for common issues
    if [ ! -f "node_modules/.bin/expo" ]; then
        print_warning "Expo not found in node_modules. Run 'npm install' first"
    fi
    
    print_success "Health checks completed"
}

# Function to show usage
show_usage() {
    echo "OOAK Call Manager Pro - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Setup development environment"
    echo "  start     - Start development server"
    echo "  deploy    - Deploy to connected device"
    echo "  build     - Build Android APK"
    echo "  health    - Run health checks"
    echo "  install   - Install dependencies only"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # First time setup"
    echo "  $0 start     # Start development server"
    echo "  $0 deploy    # Deploy to device"
    echo ""
}

# Main script logic
main() {
    echo "🚀 OOAK Call Manager Pro - Deployment Script"
    echo "=============================================="
    echo ""
    
    case "${1:-help}" in
        "setup")
            setup_dev_environment
            ;;
        "start")
            start_dev_server
            ;;
        "deploy")
            deploy_to_device
            ;;
        "build")
            build_android
            ;;
        "health")
            run_health_checks
            ;;
        "install")
            install_dependencies
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 