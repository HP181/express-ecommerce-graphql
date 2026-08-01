const typeDefs = `#graphql

  scalar Date

  # User info derived from the Cognito token — not stored in MongoDB
  type User {
    id: ID!
    email: String!
    role: String!
  }

  type Review {
    id: ID!
    user: String!
    name: String!
    rating: Int!
    comment: String!
    createdAt: Date!
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: String!
    stock: Int!
    image: String
    reviews: [Review]
    rating: Float!
    numReviews: Int!
    createdAt: Date!
  }

  type OrderItem {
    product: ID!
    name: String!
    quantity: Int!
    price: Float!
    image: String
  }

  type ShippingAddress {
    address: String
    city: String
    postalCode: String
    country: String
  }

  type Order {
    id: ID!
    user: String!
    userEmail: String
    items: [OrderItem!]!
    shippingAddress: ShippingAddress
    totalAmount: Float!
    status: String!
    isPaid: Boolean!
    paidAt: Date
    createdAt: Date!
  }

  input ProductInput {
    name: String!
    description: String!
    price: Float!
    category: String!
    stock: Int!
    image: String
  }

  input OrderItemInput {
    product: ID!
    quantity: Int!
  }

  input ShippingAddressInput {
    address: String!
    city: String!
    postalCode: String!
    country: String!
  }

  type Query {
    me: User
    product(id: ID!): Product
    products(category: String, search: String, minPrice: Float, maxPrice: Float): [Product!]!
    categories: [String!]!
    order(id: ID!): Order
    myOrders: [Order!]!
    orders: [Order!]!
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    createOrder(items: [OrderItemInput!]!, shippingAddress: ShippingAddressInput!): Order!
    updateOrderStatus(id: ID!, status: String!): Order!
    deleteOrder(id: ID!): Boolean!
    addReview(productId: ID!, rating: Int!, comment: String!): Product!
  }
`

export default typeDefs
