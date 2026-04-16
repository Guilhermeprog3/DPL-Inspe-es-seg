module.exports = {
  apps: [
    {
      name: 'SIG-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0', // Adicione o -H 0.0.0.0 aqui
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}