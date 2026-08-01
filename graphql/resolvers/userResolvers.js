import { GraphQLError } from 'graphql'
import { isAdmin } from '../../middleware/auth.js'
import User from '../../models/User.js'

const userResolvers = {
  Query: {
    // Returns the current user's info and auto-saves them to MongoDB on first login
    me: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })

      // Upsert — creates a new doc if this Cognito user hasn't logged in before
      const dbUser = await User.findOneAndUpdate(
        { sub: user.sub },
        {
          sub:   user.sub,
          email: user.email,
          name:  user.name || user['cognito:username'] || '',
          role:  isAdmin(user) ? 'admin' : 'user',
        },
        { upsert: true, new: true }
      )

      return {
        id:    dbUser._id,
        email: dbUser.email,
        name:  dbUser.name,
        role:  dbUser.role,
      }
    },

    // Admin only — list all users stored in MongoDB
    users: async (_, __, { user }) => {
      if (!isAdmin(user)) throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      const list = await User.find({}).sort({ createdAt: -1 })
      return list.map(u => ({ id: u._id, email: u.email, name: u.name, role: u.role }))
    },
  },

  Mutation: {},
}

export default userResolvers
