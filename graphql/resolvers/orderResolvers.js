import { GraphQLError } from 'graphql'
import Order from '../../models/Order.js'
import Product from '../../models/Product.js'

const orderResolvers = {
  Query: {
    order: async (_, { id }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      const order = await Order.findById(id).populate('user', '-password')
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      if (order.user._id.toString() !== user._id.toString() && user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return order
    },

    myOrders: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      return await Order.find({ user: user._id }).populate('user', '-password').sort({ createdAt: -1 })
    },

    orders: async (_, __, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      return await Order.find({}).populate('user', '-password').sort({ createdAt: -1 })
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
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          image: product.image,
        })

        totalAmount += product.price * item.quantity
        product.stock -= item.quantity
        await product.save()
      }

      const order = await Order.create({ user: user._id, items: orderItems, shippingAddress, totalAmount })
      return await Order.findById(order._id).populate('user', '-password')
    },

    updateOrderStatus: async (_, { id, status }, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })

      const update = { status }
      if (status === 'delivered') {
        update.isPaid = true
        update.paidAt = new Date()
      }

      const order = await Order.findByIdAndUpdate(id, update, { new: true }).populate('user', '-password')
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      return order
    },

    deleteOrder: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin')
        throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } })
      const order = await Order.findByIdAndDelete(id)
      if (!order) throw new GraphQLError('Order not found', { extensions: { code: 'NOT_FOUND' } })
      return true
    },
  },
}

export default orderResolvers
