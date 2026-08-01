import { config } from 'dotenv'
config({ path: './.env.config' })

import http from 'http'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import connectDB from './config/db.js'
import typeDefs from './graphql/typeDefs.js'
import resolvers from './graphql/resolvers/index.js'
import { getUser } from './middleware/auth.js'

const startServer = async () => {
  await connectDB()

  const app = express()
  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true,
  })

  await server.start()

  app.use(
    '/graphql',
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Frontend sends: Authorization: Bearer <cognito_access_token>
        const token = req.headers.authorization?.replace('Bearer ', '')
        const user = await getUser(token)
        return { user }
      },
    })
  )

  const PORT = process.env.PORT || 5000
  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`)
  })
}

startServer().catch(console.error)
