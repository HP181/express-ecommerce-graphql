import { GraphQLError } from 'graphql'
import { isAdmin } from '../../middleware/auth.js'

const userResolvers = {
  Query: {
    // Returns the current user's info derived from the Cognito token
    me: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      return {
        id:    user.sub,
        email: user.email,
        role:  isAdmin(user) ? 'admin' : 'user',
      }
    },
  },

  // No mutations — Cognito handles register/login/logout
  Mutation: {},
}

export default userResolvers
