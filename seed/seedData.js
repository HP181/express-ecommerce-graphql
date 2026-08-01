import { config } from 'dotenv'
config({ path: './.env.config' })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected for seeding...')
}

// ── Models (inline to avoid path issues) ─────────────────────────────────────
const userSchema = new mongoose.Schema({ name: String, email: String, password: String, role: String }, { timestamps: true })
const User = mongoose.models.User || mongoose.model('User', userSchema)

const productSchema = new mongoose.Schema({
  name: String, description: String, price: Number, category: String,
  stock: Number, image: String, rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }, reviews: { type: Array, default: [] },
}, { timestamps: true })
const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

const orderItemSchema = new mongoose.Schema({ product: mongoose.Schema.Types.ObjectId, name: String, quantity: Number, price: Number, image: String })
const orderSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, items: [orderItemSchema],
  shippingAddress: { address: String, city: String, postalCode: String, country: String },
  totalAmount: Number, status: { type: String, default: 'pending' },
  isPaid: { type: Boolean, default: false },
}, { timestamps: true })
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)

// ── Seed Data ─────────────────────────────────────────────────────────────────
const users = [
  { name: 'Admin User', email: 'admin@shop.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { name: 'John Doe',   email: 'john@example.com', password: bcrypt.hashSync('user123', 10), role: 'user' },
  { name: 'Jane Smith', email: 'jane@example.com', password: bcrypt.hashSync('user123', 10), role: 'user' },
]

const products = [
  // Electronics
  { name: 'iPhone 15 Pro', description: "Apple's flagship smartphone featuring the A17 Pro chip, titanium design, 48MP camera system with ProRAW support, and USB-C connectivity.", price: 999.99, category: 'Electronics', stock: 45, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80', rating: 4.8, numReviews: 124 },
  { name: 'Samsung Galaxy S24 Ultra', description: "Samsung's most powerful phone with S Pen, 200MP camera, Snapdragon 8 Gen 3 chip, and a 6.8\" Dynamic AMOLED display.", price: 1199.99, category: 'Electronics', stock: 30, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', rating: 4.7, numReviews: 89 },
  { name: 'MacBook Air M3', description: '15-inch MacBook Air with Apple M3 chip, 16GB RAM, 512GB SSD, Liquid Retina display. All-day battery life up to 18 hours.', price: 1299.99, category: 'Electronics', stock: 25, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', rating: 4.9, numReviews: 201 },
  { name: 'Sony WH-1000XM5', description: 'Industry-leading noise cancelling headphones with 30-hour battery life, crystal clear hands-free calling, and superior voice quality.', price: 349.99, category: 'Electronics', stock: 60, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80', rating: 4.7, numReviews: 312 },
  { name: 'iPad Pro 12.9"', description: 'The ultimate iPad experience with M2 chip, Liquid Retina XDR display, ProMotion technology, and support for Apple Pencil (2nd generation).', price: 1099.99, category: 'Electronics', stock: 20, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80', rating: 4.8, numReviews: 95 },
  { name: 'Dell 27" 4K Monitor', description: 'Ultra-sharp 4K UHD display with USB-C connectivity, IPS panel, 99% sRGB color coverage. Perfect for creators and professionals.', price: 449.99, category: 'Electronics', stock: 35, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', rating: 4.6, numReviews: 78 },
  // Clothing
  { name: "Men's Classic Fit T-Shirt", description: 'Premium 100% organic cotton crew-neck T-shirt. Comfortable, breathable, and available in multiple colors. Pre-shrunk fabric.', price: 29.99, category: 'Clothing', stock: 150, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', rating: 4.4, numReviews: 230 },
  { name: "Women's Floral Summer Dress", description: 'Elegant floral print midi dress with adjustable spaghetti straps. Lightweight chiffon fabric perfect for warm weather.', price: 64.99, category: 'Clothing', stock: 80, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80', rating: 4.5, numReviews: 145 },
  { name: 'Denim Jacket', description: 'Classic blue denim jacket with button closure, chest pockets, and slightly distressed finish. A wardrobe essential.', price: 89.99, category: 'Clothing', stock: 65, image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80', rating: 4.3, numReviews: 98 },
  { name: 'Running Sneakers Pro', description: 'Lightweight and responsive running shoes with advanced cushioning, breathable mesh upper, and durable rubber outsole.', price: 129.99, category: 'Clothing', stock: 90, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', rating: 4.6, numReviews: 187 },
  // Books
  { name: 'Clean Code', description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin. Learn to write readable, maintainable, and elegant code.', price: 39.99, category: 'Books', stock: 200, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80', rating: 4.9, numReviews: 521 },
  { name: 'The Pragmatic Programmer', description: 'Your Journey to Mastery, 20th Anniversary Edition. Essential reading for every software developer.', price: 44.99, category: 'Books', stock: 180, image: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600&q=80', rating: 4.8, numReviews: 389 },
  { name: 'JavaScript: The Good Parts', description: "Douglas Crockford uncovers the beautifully elegant parts of JavaScript — a language most often used in web browsers.", price: 29.99, category: 'Books', stock: 120, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80', rating: 4.5, numReviews: 267 },
  // Home & Garden
  { name: 'Robot Vacuum Cleaner', description: 'Smart robotic vacuum with laser navigation, 4000Pa suction, automatic charging, Wi-Fi connectivity and voice control support.', price: 299.99, category: 'Home & Garden', stock: 40, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', rating: 4.5, numReviews: 156 },
  { name: 'Coffee Maker Pro', description: 'Programmable 12-cup drip coffee maker with built-in grinder, thermal carafe, and brewing pause feature. Wake up to fresh coffee.', price: 149.99, category: 'Home & Garden', stock: 55, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', rating: 4.6, numReviews: 203 },
  { name: 'LED Desk Lamp', description: 'Adjustable LED desk lamp with 5 color modes, 10 brightness levels, USB charging port, and eye-caring technology. Touch control.', price: 39.99, category: 'Home & Garden', stock: 100, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', rating: 4.4, numReviews: 312 },
  { name: 'Indoor Plant Set (3 Pack)', description: 'Curated set of three low-maintenance indoor plants: Pothos, Snake Plant, and ZZ Plant. Includes decorative ceramic pots.', price: 49.99, category: 'Home & Garden', stock: 70, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=80', rating: 4.7, numReviews: 88 },
  // Sports
  { name: 'Premium Yoga Mat', description: 'Extra-thick 6mm non-slip yoga mat with alignment lines, carrying strap, and eco-friendly natural rubber material. 72" x 24".', price: 59.99, category: 'Sports', stock: 85, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80', rating: 4.6, numReviews: 234 },
  { name: 'Resistance Bands Set (5 Pack)', description: 'Professional resistance bands with 5 different resistance levels (10–50 lbs). Includes door anchor, handles, and ankle straps.', price: 29.99, category: 'Sports', stock: 130, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80', rating: 4.5, numReviews: 178 },
  { name: 'Adjustable Dumbbell Set', description: 'Space-saving adjustable dumbbells replacing 15 sets of weights. Quick-adjust selector dial from 5 to 52.5 lbs each.', price: 349.99, category: 'Sports', stock: 28, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80', rating: 4.8, numReviews: 143 },
]

// ── Main seeder ───────────────────────────────────────────────────────────────
const seedDB = async () => {
  try {
    await connectDB()

    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany()])
    console.log('Cleared existing data')

    const createdUsers    = await User.insertMany(users)
    const createdProducts = await Product.insertMany(products)
    console.log(`Inserted ${createdUsers.length} users and ${createdProducts.length} products`)

    const john    = createdUsers[1]
    const iphone  = createdProducts[0]
    const macbook = createdProducts[2]
    const yoga    = createdProducts[17]

    await Order.insertMany([
      {
        user: john._id,
        items: [
          { product: iphone._id,  name: iphone.name,  quantity: 1, price: iphone.price,  image: iphone.image },
          { product: yoga._id,    name: yoga.name,    quantity: 2, price: yoga.price,    image: yoga.image },
        ],
        shippingAddress: { address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        totalAmount: iphone.price + yoga.price * 2,
        status: 'delivered',
        isPaid: true,
        paidAt: new Date(),
      },
      {
        user: john._id,
        items: [
          { product: macbook._id, name: macbook.name, quantity: 1, price: macbook.price, image: macbook.image },
        ],
        shippingAddress: { address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        totalAmount: macbook.price,
        status: 'processing',
      },
    ])

    console.log('\n✅  Database seeded successfully!\n')
    console.log('Admin  →  admin@shop.com  /  admin123')
    console.log('User   →  john@example.com  /  user123')
    console.log('User   →  jane@example.com  /  user123\n')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seedDB()
