module.exports = {
  apps: [{
    name: 'wedding-crm',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/wedding-crm',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/wedding-crm/error.log',
    out_file: '/var/log/wedding-crm/out.log',
    log_file: '/var/log/wedding-crm/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: ['--max-old-space-size=1024'],
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    restart_delay: 4000
  }]
} 