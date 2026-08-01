import { config } from 'dotenv'
config({ path: './.env.config' }) // only used locally; Vercel uses dashboard env vars

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import connectDB from './config/db.js'
import typeDefs from './graphql/typeDefs.js'
import resolvers from './graphql/resolvers/index.js'
import { getUser } from './middleware/auth.js'

const app = express()

// Run once — shared across serverless invocations (Vercel reuses warm instances)
const initPromise = (async () => {
  await connectDB()

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  })
  await server.start()

  app.use(
    '/graphql',
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '')
        const user = await getUser(token)
        return { user }
      },
    })
  )
})()

// ── Vercel export ─────────────────────────────────────────────────────────────
// Vercel calls this function for every request instead of running a long-lived server
export default async function handler(req, res) {
  await initPromise  // wait for DB + Apollo to be ready (instant on warm starts)
  app(req, res)
}

// ── Local dev ─────────────────────────────────────────────────────────────────
// On Vercel, NODE_ENV is 'production' so this block never runs
if (process.env.NODE_ENV !== 'production') {
  initPromise.then(() => {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`Server ready at http://localhost:${PORT}/graphql`))
  }).catch(console.error)
}
