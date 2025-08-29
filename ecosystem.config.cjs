@@ .. @@
       env: {
         NODE_ENV: 'production',
         PORT: 3001,
+        SERVER_IP: process.env.SERVER_IP || '107.3.52.136',
         DB_SERVER: process.env.DB_SERVER || 'localhost',
         DB_PORT: process.env.DB_PORT || 1433,
         DB_DATABASE: process.env.DB_DATABASE || 'datacenter_equipment',
@@ .. @@
         JWT_SECRET: process.env.JWT_SECRET || 'your_production_jwt_secret_here',
         JWT_EXPIRES_IN: '24h',
-        ALLOWED_ORIGINS: 'http://localhost,https://datacenter.local',
+        ALLOWED_ORIGINS: 'http://localhost,http://localhost:5173,http://107.3.52.136,https://107.3.52.136,https://datacenter.local',
         RATE_LIMIT_WINDOW_MS: 900000,
         RATE_LIMIT_MAX_REQUESTS: 100
       },