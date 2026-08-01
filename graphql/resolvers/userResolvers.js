import { GraphQLError } from 'graphql'
import User from '../../models/User.js'
import generateToken from '../../utils/generateToken.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      return user
    },

    users: async (_, __, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return await User.find({}).select('-password')
    },
  },

  Mutation: {
    register: async (_, { input }, { res }) => {
      const { name, email, password } = input
      const exists = await User.findOne({ email })
      if (exists) throw new GraphQLError('Email already registered', { extensions: { code: 'BAD_USER_INPUT' } })

      const newUser = await User.create({ name, email, password })
      const token = generateToken(newUser._id)
      res.cookie('token', token, COOKIE_OPTIONS)

      return { token, user: newUser }
    },

    login: async (_, { input }, { res }) => {
      const { email, password } = input
      const user = await User.findOne({ email })
      if (!user || !(await user.matchPassword(password)))
        throw new GraphQLError('Invalid email or password', { extensions: { code: 'BAD_USER_INPUT' } })

      const token = generateToken(user._id)
      res.cookie('token', token, COOKIE_OPTIONS)

      return { token, user }
    },

    logout: async (_, __, { res }) => {
      res.cookie('token', '', { maxAge: 0, httpOnly: true })
      return true
    },
  },
}

export default userResolvers
