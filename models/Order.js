import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  image:    { type: String, default: '' },
})

const orderSchema = new mongoose.Schema(
  {
    user:      { type: String, required: true },  // Cognito sub (unique user ID)
    userEmail: { type: String, default: '' },      // stored for display in admin
    items:     [orderItemSchema],
    shippingAddress: {
      address:    String,
      city:       String,
      postalCode: String,
      country:    String,
    },
    totalAmount: { type: Number, required: true },
    status: {
      type:    String,
      enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
