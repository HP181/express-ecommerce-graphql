import { GraphQLScalarType, Kind } from 'graphql'
import userResolvers from './userResolvers.js'
import productResolvers from './productResolvers.js'
import orderResolvers from './orderResolvers.js'

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO 8601 date string',
  serialize:    (value) => new Date(value).toISOString(),
  parseValue:   (value) => new Date(value),
  parseLiteral: (ast)   => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
})

const resolvers = {
  Date: DateScalar,
  Query: {
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
}

export default resolvers
