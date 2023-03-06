module.exports = {
  apps: [
    {
      script: '/opt/homebrew/bin/node ./lib/src/index.js',
      watch: '.',
      name: 'nuimo-mqtt',
      env_production: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      }
    }
  ],
  deploy: {
    production: {
      user: 'shin1ohno',
      host: 'mini.home.local',
      ref: 'origin/main',
      repo: 'https://github.com/shin1ohno/nuimo-mqtt.git',
      path: '/Users/shin1ohno/Documents/work/nuimo-mqtt-production',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.cjs --env production',
    },
  },
}