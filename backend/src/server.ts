import { createServer } from 'node:http'
import { app } from './app.js'
import { env } from './config/env.js'

const server = createServer(app)
server.requestTimeout = 15_000
server.headersTimeout = 16_000
server.keepAliveTimeout = 5_000

server.listen(env.port, '0.0.0.0', () => {
  console.info(`${env.appName} v${env.appVersion} listening on port ${env.port} (${env.nodeEnv})`)
  console.info(`Optional integrations: DynamoDB=${env.enableDynamoDB ? 'enabled' : 'disabled'}, Bedrock=${env.enableBedrock ? 'enabled' : 'disabled'}`)
})

function shutdown(signal: string): void {
  console.info(`Received ${signal}; closing HTTP server`)
  server.close((error) => {
    if (error) {
      console.error('HTTP server shutdown failed')
      process.exitCode = 1
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
