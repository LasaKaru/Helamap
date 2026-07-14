/**
 * PM2 process file for production VPS deployments.
 *   1. npm run build && npm --prefix server run build
 *   2. pm2 start ecosystem.config.cjs
 * Serve dist/ with nginx/Apache (see deploy/nginx.conf); PM2 keeps the API alive.
 */
module.exports = {
  apps: [
    {
      name: 'facilityflow-api',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
