// PM2 Ecosystem Configuration for Datacenter Equipment Management
// This configuration manages the Node.js application with PM2 process manager

module.exports = {
  apps: [
    {
      name: 'datacenter-equipment-api',
      script: './server/index.js',
      cwd: process.env.INSTALL_PATH || 'D:/nginx/pistolas',
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',
      
      // Load environment file
      env_file: './.env',
      
      // Production environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0', 
        ALLOWED_ORIGINS: 'http://localhost,http://localhost:5173,http://107.3.52.136,https://107.3.52.136',
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX_REQUESTS: 500,
        DB_SERVER: 'localhost',
        DB_PORT: 1433,
        DB_DATABASE: 'datacenter_equipment',
        DB_USER: 'sa',
        RATE_LIMIT_MAX_REQUESTS: 100,
        // ServiceNow API integration (Two-step authentication)
        ALMA_AUTH_URL: process.env.ALMA_AUTH_URL || '',
        ALMA_AUTH_USER: process.env.ALMA_AUTH_USER || '',
        ALMA_AUTH_PASS: process.env.ALMA_AUTH_PASS || '',
        ALMA_SN_URL: process.env.ALMA_SN_URL || ''
      },
      
      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        SERVER_IP: 'localhost',
        ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
        // ServiceNow API integration (Two-step authentication - development)
        ALMA_AUTH_URL: process.env.ALMA_AUTH_URL || '',
        ALMA_AUTH_USER: process.env.ALMA_AUTH_USER || '',
        ALMA_AUTH_PASS: process.env.ALMA_AUTH_PASS || '',
        ALMA_SN_URL: process.env.ALMA_SN_URL || ''
      },
      
      // Monitoring and logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2.log',
      time: true,
      
      // Auto-restart settings
      watch: false, // Set to true in development
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git'
      ],
      
      // Resource limits
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 5,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 5000,
      shutdown_with_message: true,
      
      // Advanced PM2 features
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      pmx: true,
      automation: false,
      
      // Windows-specific settings
      windowsHide: true
    }
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'Administrator',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'your-repository-url',
      path: 'D:/nginx/pistolas',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};