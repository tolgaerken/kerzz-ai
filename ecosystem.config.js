module.exports = {
  apps: [
    {
      name: 'kerzz-embedding',
      cwd: '/home/admin/clawd/kerzz-ai/packages/db',
      script: 'venv/bin/python',
      args: 'embedding_service.py',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        PORT: 8001
      },
      error_file: '/home/admin/.pm2/logs/kerzz-embedding-error.log',
      out_file: '/home/admin/.pm2/logs/kerzz-embedding-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'kerzz-api',
      cwd: '/home/admin/clawd/kerzz-ai/apps/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/admin/.pm2/logs/kerzz-api-error.log',
      out_file: '/home/admin/.pm2/logs/kerzz-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'kerzz-web',
      cwd: '/home/admin/clawd/kerzz-ai/apps/web',
      script: 'npx',
      args: 'vite preview --port 5173 --host',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/admin/.pm2/logs/kerzz-web-error.log',
      out_file: '/home/admin/.pm2/logs/kerzz-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
