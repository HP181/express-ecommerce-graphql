import { createRemoteJWKSet, jwtVerify } from 'jose'

// Build these lazily inside the function so env vars are guaranteed loaded
let JWKS   = null
let ISSUER = null

function getJWKS() {
  if (!JWKS) {
    const region     = process.env.COGNITO_REGION
    const userPoolId = process.env.COGNITO_USER_POOL_ID

    if (!region || !userPoolId) {
      console.error('Missing COGNITO_REGION or COGNITO_USER_POOL_ID env vars')
      return null
    }

    ISSUER = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
    JWKS   = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`))
  }
  return JWKS
}

export const getUser = async (token) => {
  if (!token) return null

  const jwks = getJWKS()
  if (!jwks) return null

  try {
    // audience check skipped — ID tokens have client_id as audience, access tokens have 'cognito'
    const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER, algorithms: ['RS256'] })
    console.log('Token verified — user:', payload.email || payload.sub)
    return payload
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return null
  }
}

export const isAdmin = (user) =>
  user?.['cognito:groups']?.includes('admin') ||
  user?.email === process.env.ADMIN_EMAIL
