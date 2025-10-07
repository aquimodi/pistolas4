# Datacenter Equipment Management System

A comprehensive, enterprise-grade web application for managing IT equipment reception and tracking in datacenter environments.

## Features

### Core Functionality
- **Hierarchical Equipment Management**: Project → Order → Delivery Note → Equipment
- **Role-Based Access Control**: Admin, Manager, Operator, and Viewer roles
- **Real-Time Monitoring**: System performance metrics and application logs
- **Audit Trail**: Complete logging of all user actions and system events
- **Professional UI**: Modern, responsive interface designed for datacenter operations

### Technical Features
- **SQL Server Integration**: Robust database with proper relationships and constraints
- **RESTful API**: Comprehensive backend with proper error handling
- **Authentication**: Secure JWT-based authentication system
- **Performance Monitoring**: Real-time metrics and logging with PM2
- **Production Ready**: NGINX configuration and deployment scripts

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Responsive design with mobile support

### Backend
- Node.js with Express
- SQL Server with mssql driver
- JWT authentication
- Winston logging
- Helmet security middleware
- Rate limiting and CORS protection

### Infrastructure
- NGINX reverse proxy
- PM2 process manager
- Windows Server 2019 deployment
- SQL Server 2019+ database

## Quick Start

### Development Environment

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Update database credentials in .env file
   ```

3. **Set up database**:
   ```bash
   # Execute the SQL migration files in Supabase
   # Or use SQL Server Management Studio with the provided SQL scripts
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Default Login Credentials
- **Admin**: admin / admin
- **Operator**: operator / operator

## Production Deployment

### Prerequisites
- Windows Server 2019
- Node.js 18+
- SQL Server 2019+
- NGINX web server
- Administrator privileges

### Installation Steps

1. **Run automated installer**:
   ```powershell
   # Run as Administrator
   .\deployment\install.ps1
   ```

2. **Set up database**:
   ```bash
   sqlcmd -S localhost -i sql\schema.sql
   sqlcmd -S localhost -i sql\sample-data.sql
   ```

3. **Build and deploy**:
   ```batch
   deployment\build-and-deploy.bat
   ```

4. **Configure NGINX**:
   ```bash
   copy deployment\nginx.conf D:\nginx\conf\nginx.conf
   nginx -s reload
   ```

5. **Start services**:
   ```batch
   start-system.bat
   ```

### Manual Installation

1. **Prepare environment**:
   - Install Node.js 18+
   - Install PM2: `npm install -g pm2`
   - Configure SQL Server database

2. **Deploy application**:
   ```bash
   # Copy files to D:\nginx\pistolas
   npm install --production
   npm run build
   ```

3. **Configure services**:
   ```bash
   pm2 start ecosystem.config.cjs --env production
   pm2 startup
   pm2 save
   ```

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Application pages/routes
│   └── services/          # API integration services
├── server/                # Backend Node.js application
│   ├── config/            # Database and app configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   └── utils/             # Utility functions
├── sql/                   # Database schema and sample data
├── deployment/            # Production deployment files
│   ├── nginx.conf         # NGINX configuration
│   ├── ecosystem.config.js # PM2 configuration
│   ├── install.ps1        # PowerShell installer
│   └── build-and-deploy.bat # Build script
└── logs/                  # Application logs
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### Core Resource Endpoints
- `GET/POST /api/projects` - Project management
- `GET/POST /api/orders` - Order management
- `GET/POST /api/delivery-notes` - Delivery note management
- `GET/POST /api/equipment` - Equipment management

### Monitoring Endpoints
- `GET /api/monitoring/status` - System status
- `GET /api/monitoring/logs` - Application logs
- `GET /api/monitoring/metrics` - Performance metrics

## Database Schema

The system uses a hierarchical structure with the following relationships:

```
Projects (1:n) → Orders (1:n) → Delivery Notes (1:n) → Equipment
```

### Key Tables
- **users**: System authentication and authorization
- **projects**: Top-level project containers
- **orders**: Equipment purchase orders
- **delivery_notes**: Shipment tracking documents
- **equipment**: Individual equipment items
- **audit_logs**: Complete activity audit trail

## Security Features

- **Authentication**: JWT-based with configurable expiration
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete user activity tracking
- **Security Headers**: NGINX security configuration

## Monitoring and Logging

### Application Monitoring
- Real-time performance metrics
- API request tracking
- Error rate monitoring
- User activity logging

### System Monitoring
- Process health via PM2
- Memory and CPU usage
- Database connection status
- Log file rotation

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error-level logs only
- `logs/pm2-*.log` - PM2 process logs

## Maintenance

### Regular Tasks
- Monitor log files for errors
- Review performance metrics
- Update dependencies monthly
- Backup database daily

### Commands
```bash
# View application status
pm2 list

# View logs
pm2 logs

# Restart application
pm2 restart all

# Update application
git pull
npm install
npm run build
pm2 reload ecosystem.config.cjs --env production
```

## Troubleshooting

### Common Issues

1. **Database Connection Fails**:
   - Verify SQL Server is running
   - Check connection string in .env
   - Ensure database user has proper permissions

2. **API Returns 502 Error**:
   - Check PM2 process status: `pm2 list`
   - Verify Node.js application is running
   - Check application logs: `pm2 logs`

3. **Frontend Not Loading**:
   - Verify NGINX is running
   - Check NGINX configuration
   - Ensure dist files are properly deployed

4. **Authentication Issues**:
   - Verify JWT_SECRET is configured
   - Check user credentials in database
   - Review authentication logs

### Support

For technical support and additional documentation, refer to:
- Application logs in `logs/` directory
- PM2 process monitoring: `pm2 monit`
- NGINX access logs: `D:/nginx/logs/`

## License

Enterprise Software - All Rights Reserved
