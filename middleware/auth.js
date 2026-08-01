import { createRemoteJWKSet, jwtVerify } from 'jose'

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const REGION       = process.env.COGNITO_REGION

// Cognito publishes its public keys here — jose fetches and caches them
const JWKS = createRemoteJWKSet(
  new URL(`https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`)
)

const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`

export const getUser = async (token) => {
  if (!token) return null
  try {
    // Verify the token signature and expiry against Cognito's public keys
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER })

    // Return the decoded token payload — contains sub, email, cognito:groups, etc.
    return payload
  } catch {
    return null
  }
}

// Helper used in resolvers to check if the user is admin
// Either via Cognito group OR matching the ADMIN_EMAIL env var
export const isAdmin = (user) =>
  user?.['cognito:groups']?.includes('admin') ||
  user?.email === process.env.ADMIN_EMAIL
