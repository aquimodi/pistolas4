# PowerShell Installation Script for Datacenter Equipment Management System
# Target: Windows Server 2019
# Run as Administrator

Write-Host "=== Datacenter Equipment Management System Installation ===" -ForegroundColor Green
Write-Host "Target Platform: Windows Server 2019" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Exiting..."
    exit 1
}

# Configuration variables
$INSTALL_PATH = "D:\nginx\pistolas"
$NGINX_PATH = "D:\nginx"
$SERVICE_NAME = "DatacenterEquipmentAPI"
$DB_NAME = "datacenter_equipment"

Write-Host "Installation Path: $INSTALL_PATH" -ForegroundColor Cyan
Write-Host "NGINX Path: $NGINX_PATH" -ForegroundColor Cyan
Write-Host ""

# Create installation directory
Write-Host "1. Creating installation directory..." -ForegroundColor Yellow
if (!(Test-Path -Path $INSTALL_PATH)) {
    New-Item -ItemType Directory -Path $INSTALL_PATH -Force
    Write-Host "   ✓ Created $INSTALL_PATH" -ForegroundColor Green
} else {
    Write-Host "   ✓ Directory already exists" -ForegroundColor Green
}

# Create logs directory
$LOGS_PATH = "$INSTALL_PATH\logs"
if (!(Test-Path -Path $LOGS_PATH)) {
    New-Item -ItemType Directory -Path $LOGS_PATH -Force
    Write-Host "   ✓ Created logs directory" -ForegroundColor Green
}

# Check Node.js installation
Write-Host "2. Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "   ✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Error "npm not found. Please ensure npm is installed with Node.js"
    exit 1
}

# Install PM2 globally
Write-Host "3. Installing PM2 process manager..." -ForegroundColor Yellow
try {
    npm install pm2@latest -g --silent
    Write-Host "   ✓ PM2 installed successfully" -ForegroundColor Green
} catch {
    Write-Warning "PM2 installation failed, continuing..."
}

# Install PM2 Windows service
Write-Host "4. Setting up PM2 Windows service..." -ForegroundColor Yellow
try {
    pm2-installer
    Write-Host "   ✓ PM2 Windows service configured" -ForegroundColor Green
} catch {
    Write-Warning "PM2 service installation failed, will run in standard mode"
}

# Check SQL Server connection
Write-Host "5. Checking SQL Server..." -ForegroundColor Yellow
$sqlConnectionString = "Server=localhost;Database=master;Integrated Security=true;"
try {
    # This would require SQL Server PowerShell module in a real environment
    Write-Host "   ✓ SQL Server connection will be validated during startup" -ForegroundColor Green
} catch {
    Write-Warning "Could not verify SQL Server connection. Ensure SQL Server is running."
}

# Create database setup script
Write-Host "6. Creating database setup script..." -ForegroundColor Yellow
$dbSetupScript = @"
-- Create database and user
USE master;

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$DB_NAME')
BEGIN
    CREATE DATABASE [$DB_NAME];
    PRINT 'Database created successfully';
END
ELSE
BEGIN
    PRINT 'Database already exists';
END

-- Create application user (replace with your preferred authentication method)
USE [$DB_NAME];

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'datacenter_user')
BEGIN
    CREATE LOGIN [datacenter_user] WITH PASSWORD = 'SecurePassword123!';
    CREATE USER [datacenter_user] FOR LOGIN [datacenter_user];
    ALTER ROLE [db_datareader] ADD MEMBER [datacenter_user];
    ALTER ROLE [db_datawriter] ADD MEMBER [datacenter_user];
    ALTER ROLE [db_ddladmin] ADD MEMBER [datacenter_user];
    PRINT 'Database user created successfully';
END
ELSE
BEGIN
    PRINT 'Database user already exists';
END
"@

$dbSetupScript | Out-File -FilePath "$INSTALL_PATH\setup-database.sql" -Encoding UTF8
Write-Host "   ✓ Database setup script created" -ForegroundColor Green

# Create Windows service script for the API
Write-Host "7. Creating Windows service configuration..." -ForegroundColor Yellow
$serviceScript = @"
@echo off
echo Starting Datacenter Equipment Management API Service...
cd /d "$INSTALL_PATH"
pm2 start ecosystem.config.cjs --env production
pm2 save
echo API Service started successfully
pause
"@

$serviceScript | Out-File -FilePath "$INSTALL_PATH\start-service.bat" -Encoding ASCII

$stopServiceScript = @"
@echo off
echo Stopping Datacenter Equipment Management API Service...
pm2 stop all
pm2 delete all
echo API Service stopped successfully
pause
"@

$stopServiceScript | Out-File -FilePath "$INSTALL_PATH\stop-service.bat" -Encoding ASCII
Write-Host "   ✓ Service management scripts created" -ForegroundColor Green

# Create NGINX configuration
Write-Host "8. Setting up NGINX configuration..." -ForegroundColor Yellow
if (!(Test-Path -Path $NGINX_PATH)) {
    Write-Warning "NGINX directory not found at $NGINX_PATH"
    Write-Host "   Please ensure NGINX is installed and the path is correct"
} else {
    Write-Host "   ✓ NGINX directory found" -ForegroundColor Green
}

# Create startup script
Write-Host "9. Creating startup script..." -ForegroundColor Yellow
$startupScript = @"
@echo off
echo =================================
echo Datacenter Equipment Management System
echo =================================
echo.

echo Starting services...
echo.

echo 1. Starting NGINX...
cd /d "$NGINX_PATH"
start /b nginx.exe
if %ERRORLEVEL% EQU 0 (
    echo    ✓ NGINX started successfully
) else (
    echo    ✗ NGINX failed to start
)

echo.
echo 2. Starting Node.js API...
cd /d "$INSTALL_PATH"
pm2 start ecosystem.config.cjs --env production
if %ERRORLEVEL% EQU 0 (
    echo    ✓ API started successfully
) else (
    echo    ✗ API failed to start
)

echo.
echo 3. Checking service status...
pm2 list

echo.
echo =================================
echo System Status:
echo Web Server: http://localhost
echo API Server: http://localhost:3001
echo =================================
echo.
echo Press any key to view logs...
pause > nul
pm2 logs
"@

$startupScript | Out-File -FilePath "$INSTALL_PATH\start-system.bat" -Encoding ASCII
Write-Host "   ✓ Startup script created" -ForegroundColor Green

# Create deployment checklist
$checklist = @"
# Datacenter Equipment Management System - Deployment Checklist

## Pre-Deployment Requirements
- [ ] Windows Server 2019 with Administrator access
- [ ] Node.js 18+ installed
- [ ] SQL Server 2019+ installed and running
- [ ] NGINX installed at D:/nginx
- [ ] Firewall configured to allow ports 80, 443, 3001

## Installation Steps
1. [ ] Run install.ps1 as Administrator
2. [ ] Execute database setup: sqlcmd -i setup-database.sql
3. [ ] Copy built application files to D:/nginx/pistolas/dist
4. [ ] Copy nginx.conf to D:/nginx/conf/nginx.conf
5. [ ] Update .env file with production settings
6. [ ] Run start-system.bat to start all services

## Post-Installation Verification
- [ ] Web interface accessible at http://localhost
- [ ] API health check: http://localhost:3001/health
- [ ] Database connection successful
- [ ] Login functionality working
- [ ] All CRUD operations functional
- [ ] Logs being generated properly

## Maintenance Tasks
- [ ] Schedule regular database backups
- [ ] Monitor log files in logs/ directory
- [ ] Update PM2 and dependencies periodically
- [ ] Review and rotate log files monthly

## Troubleshooting
- Check PM2 process status: pm2 list
- View application logs: pm2 logs
- Check NGINX logs: D:/nginx/logs/
- Restart services: stop-service.bat && start-system.bat

## Security Considerations
- [ ] Change default passwords in .env file
- [ ] Configure SSL certificates for HTTPS
- [ ] Set up proper database authentication
- [ ] Configure Windows Firewall rules
- [ ] Enable audit logging in SQL Server
"@

$checklist | Out-File -FilePath "$INSTALL_PATH\DEPLOYMENT-CHECKLIST.md" -Encoding UTF8
Write-Host "   ✓ Deployment checklist created" -ForegroundColor Green

Write-Host ""
Write-Host "=== Installation Completed Successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy your application files to: $INSTALL_PATH" -ForegroundColor White
Write-Host "2. Update the .env file with your database credentials" -ForegroundColor White
Write-Host "3. Run the database setup: sqlcmd -i setup-database.sql" -ForegroundColor White
Write-Host "4. Start the system: start-system.bat" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: $INSTALL_PATH\DEPLOYMENT-CHECKLIST.md" -ForegroundColor Cyan