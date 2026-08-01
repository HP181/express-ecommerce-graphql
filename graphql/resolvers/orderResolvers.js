import { GraphQLError } from 'graphql'
import { isAdmin } from '../../middleware/auth.js'
import Order from '../../models/Order.js'
import Product from '../../models/Product.js'

const orderResolvers = {
  Query: {
    order: async (_, { id }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      const order = await Order.findById(id)
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      // Allow access only to the owner or an admin
      if (order.user !== user.sub && !isAdmin(user))
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return order
    },

    // Only return orders belonging to the logged-in user (matched by Cognito sub)
    myOrders: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      return await Order.find({ user: user.sub }).sort({ createdAt: -1 })
    },

    // Admin only — all orders
    orders: async (_, __, { user }) => {
      if (!isAdmin(user)) throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return await Order.find({}).sort({ createdAt: -1 })
    },
  },

  Mutation: {
    createOrder: async (_, { items, shippingAddress }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })

      let totalAmount = 0
      const orderItems = []

      for (const item of items) {
        const product = await Product.findById(item.product)
        if (!product)
          throw new GraphQLError(`Product not found: ${item.product}`, { extensions: { code: 'NOT_FOUND' } })
        if (product.stock < item.quantity)
          throw new GraphQLError(`Insufficient stock for "${product.name}"`, { extensions: { code: 'BAD_USER_INPUT' } })

        orderItems.push({
          product:  product._id,
          name:     product.name,
          quantity: item.quantity,
          price:    product.price,
          image:    product.image,
        })

        totalAmount += product.price * item.quantity
        product.stock -= item.quantity
        await product.save()
      }

      // Store Cognito sub as user ID and email for display
      return await Order.create({
        user:            user.sub,
        userEmail:       user.email,
        items:           orderItems,
        shippingAddress,
        totalAmount,
      })
    },

    updateOrderStatus: async (_, { id, status }, { user }) => {
      if (!isAdmin(user)) throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })

      const update = { status }
      if (status === 'delivered') {
        update.isPaid = true
        update.paidAt = new Date()
      }

      const order = await Order.findByIdAndUpdate(id, update, { new: true })
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      return order
    },

    deleteOrder: async (_, { id }, { user }) => {
      if (!isAdmin(user)) throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      const order = await Order.findByIdAndDelete(id)
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      return true
    },
  },
}

export default orderResolvers
