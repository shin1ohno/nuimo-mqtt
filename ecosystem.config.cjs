module.exports = {
  apps: [
    {
      script: '$HOME/.volta/bin/node /home/shin1ohno/deploy/nuimo-mqtt-production/current/lib/src/index.js',
      watch: '.',
      name: 'nuimo-mqtt',
      env_production: {
        NODE_ENV: 'production',
        BROKER_URL: 'mqtt://mqbroker.home.local:1883'
      },
      env_development: {
        NODE_ENV: 'development',
        BROKER_URL: 'mqtt://localhost:1883'
      }
    }
  ],
  deploy: {
    production: {
      user: 'shin1ohno',
      host: 'node-blue.home.local',
      ref: 'origin/main',
      repo: 'https://github.com/shin1ohno/nuimo-mqtt.git',
      path: '/home/shin1ohno/deploy/nuimo-mqtt-production',
      'post-deploy':
        'export PATH=$HOME/.volta/bin:$PATH && npm install && rm -rf lib && npm run build && pm2 reload ecosystem.config.cjs --env production',
    },
  },
}
