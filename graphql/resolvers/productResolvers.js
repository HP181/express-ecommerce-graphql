import { GraphQLError } from 'graphql'
import Product from '../../models/Product.js'

const productResolvers = {
  Query: {
    product: async (_, { id }) => {
      const product = await Product.findById(id)
      if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } })
      return product
    },

    products: async (_, { category, search, minPrice, maxPrice }) => {
      const query = {}
      if (category && category !== 'All') query.category = category
      if (search) query.name = { $regex: search, $options: 'i' }
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {}
        if (minPrice !== undefined) query.price.$gte = minPrice
        if (maxPrice !== undefined) query.price.$lte = maxPrice
      }
      return await Product.find(query).sort({ createdAt: -1 })
    },

    categories: async () => {
      return await Product.distinct('category')
    },
  },

  Mutation: {
    createProduct: async (_, { input }, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return await Product.create(input)
    },

    updateProduct: async (_, { id, input }, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      const product = await Product.findByIdAndUpdate(id, input, { new: true, runValidators: true })
      if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } })
      return product
    },

    deleteProduct: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      const product = await Product.findByIdAndDelete(id)
      if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } })
      return true
    },

    addReview: async (_, { productId, rating, comment }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })

      const product = await Product.findById(productId)
      if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } })

      const alreadyReviewed = product.reviews.find(r => r.user.toString() === user._id.toString())
      if (alreadyReviewed)
        throw new GraphQLError('You have already reviewed this product', { extensions: { code: 'BAD_USER_INPUT' } })

      product.reviews.push({ user: user._id, name: user.name, rating, comment })
      product.numReviews = product.reviews.length
      product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length

      await product.save()
      return product
    },
  },
}

export default productResolvers
