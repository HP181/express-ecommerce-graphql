import mongoose from 'mongoose'

// Users are authenticated via AWS Cognito — no password stored here.
// A document is created in MongoDB the first time a user calls the `me` query.
const userSchema = new mongoose.Schema(
  {
    sub:   { type: String, required: true, unique: true }, // Cognito user ID
    email: { type: String, required: true, unique: true },
    name:  { type: String, default: '' },
    role:  { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
