import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const getUser = async (token) => {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    return user || null
  } catch {
    return null
  }
}

export { getUser }
