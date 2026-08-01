# ShopQL — Express GraphQL Backend

A GraphQL API built with Apollo Server v4 and Express, backed by MongoDB Atlas, with AWS Cognito JWT verification. Deployed on Vercel as a serverless function.

**Live URL:** https://express-ecommerce-graphql.vercel.app/graphql

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js + Express | HTTP server |
| Apollo Server v4 | GraphQL server |
| Mongoose | MongoDB ODM |
| MongoDB Atlas | Database |
| jose | Cognito JWT verification (JWKS) |
| Vercel | Serverless deployment |

---

## Features

- **GraphQL API** — single `/graphql` endpoint for all operations
- **AWS Cognito auth** — verifies ID tokens from the frontend using Cognito's public JWKS
- **Auto user sync** — saves Cognito users to MongoDB on their first request
- **Product CRUD** — create, update, delete products (admin only)
- **Orders** — create orders, track status, admin can update/delete
- **Reviews** — authenticated users can review products
- **Admin guard** — checks `email === ADMIN_EMAIL` or `cognito:groups` includes `admin`

---

## Project Structure

```
backend/
├── config/
│   └── db.js                       # MongoDB Atlas connection
├── graphql/
│   ├── typeDefs.js                  # Full GraphQL schema
│   └── resolvers/
│       ├── index.js                 # Merges all resolvers + Date scalar
│       ├── userResolvers.js         # me query, users query (admin), auto MongoDB upsert
│       ├── productResolvers.js      # products, product, categories, CRUD, addReview
│       └── orderResolvers.js        # myOrders, orders (admin), createOrder, updateStatus, delete
├── middleware/
│   └── auth.js                      # getUser() — verifies Cognito JWT via JWKS
├── models/
│   ├── User.js                      # Cognito user stored in MongoDB (sub, email, role)
│   ├── Product.js                   # Product with reviews subdocument
│   └── Order.js                     # Order with items, shipping, status
├── seed/
│   └── seedData.js                  # Seeds sample products and orders
├── server.js                        # Express + Apollo setup, Vercel handler export
├── vercel.json                      # Vercel serverless config
└── .env.config                      # Local env vars (not committed)
```

---

## GraphQL Schema

### Queries

| Query | Auth | Description |
|-------|------|-------------|
| `me` | User | Returns current user, upserts to MongoDB |
| `users` | Admin | All registered users |
| `products(category, search)` | Public | Product list with optional filters |
| `product(id)` | Public | Single product with reviews |
| `categories` | Public | Distinct category strings |
| `myOrders` | User | Orders belonging to the logged-in user |
| `orders` | Admin | All orders |

### Mutations

| Mutation | Auth | Description |
|----------|------|-------------|
| `createProduct(input)` | Admin | Add a new product |
| `updateProduct(id, input)` | Admin | Edit a product |
| `deleteProduct(id)` | Admin | Remove a product |
| `addReview(productId, rating, comment)` | User | Add a product review |
| `createOrder(items, shippingAddress)` | User | Place an order, decrements stock |
| `updateOrderStatus(id, status)` | Admin | Change order status |
| `deleteOrder(id)` | Admin | Remove an order |

---

## Authentication Flow

The backend does **not** handle signup or login — that is fully delegated to AWS Cognito.

```
Frontend sends:
  Authorization: Bearer <cognito_id_token>
         ↓
auth.js  getUser(token)
  1. Fetches Cognito's public JWKS from:
     https://cognito-idp.<REGION>.amazonaws.com/<USER_POOL_ID>/.well-known/jwks.json
  2. Verifies the token signature and issuer using `jose`
  3. Returns the decoded payload ({ sub, email, cognito:groups, ... })
         ↓
Resolver receives { user } in context
  - user === null  →  not authenticated
  - isAdmin(user)  →  email matches ADMIN_EMAIL or in cognito:groups 'admin'
```

> **Why the ID token?**
> Cognito's access token does not contain `email`. The ID token does.
> `isAdmin()` needs `user.email` to compare against `ADMIN_EMAIL`.

### Auto User Sync to MongoDB

Every time an authenticated user calls the `me` query (which happens on every page load in the frontend), the backend runs:

```js
User.findOneAndUpdate(
  { sub: user.sub },             // find by Cognito user ID
  { sub, email, name, role },    // update fields
  { upsert: true, new: true }    // create if not exists
)
```

This means:
- First login → user document created in MongoDB
- Subsequent logins → user document updated
- Admin Users tab shows everyone who has ever logged in

---

## Environment Variables

For **local development**, create `.env.config` in the `backend/` folder:

```env
MONGO_URI=mongodb://...   # Direct connection string (not SRV if ISP blocks DNS SRV)
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# AWS Cognito — used to verify tokens
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1

# Email that gets admin privileges
ADMIN_EMAIL=your-admin@email.com
```

For **Vercel**, set these same keys in **Vercel → Settings → Environment Variables**
(`.env.config` is not deployed — Vercel uses its own env var system).

---

## MongoDB Atlas — Connection Note

If your ISP blocks SRV DNS lookups, the standard `mongodb+srv://` connection string will fail with `querySrv ECONNREFUSED`. Use a direct connection string instead:

```
mongodb://<user>:<password>@<host1>:27017,<host2>:27017,<host3>:27017/<db>?tls=true&authSource=admin
```

To find the three host addresses, run:
```bash
nslookup -type=SRV _mongodb._tcp.<your-cluster>.mongodb.net 8.8.8.8
```

---

## Local Development

```bash
npm install
npm run dev      # starts nodemon on port 5000
```

GraphQL Playground available at: `http://localhost:5000/graphql`

---

## Seeding Sample Data

```bash
node seed/seedData.js
```

This inserts sample products across multiple categories. Run from the `backend/` directory.

---

## Deployment (Vercel)

### Why `server.js` exports a handler instead of calling `listen()`

Vercel is **serverless** — there is no long-running process. A new function instance starts per request and shuts down after.

```
Traditional server:          Vercel serverless:
app.listen(5000)      vs     export default handler(req, res)
(runs forever)               (called once per request)
```

The `initPromise` pattern ensures MongoDB and Apollo Server are only initialised once per instance, even though `handler` is called many times:

```js
const initPromise = (async () => {
  await connectDB()
  await apolloServer.start()
  // attach middleware...
})()

export default async function handler(req, res) {
  await initPromise  // instant on warm starts, runs once on cold start
  app(req, res)
}
```

### `vercel.json`

```json
{
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

- `builds` — tells Vercel to treat `server.js` as a Node.js serverless function
- `routes` — forwards every request to that function (so `/graphql` works)

### Required Vercel Environment Variables

| Key | Description |
|-----|-------------|
| `MONGO_URI` | MongoDB Atlas direct connection string |
| `COGNITO_USER_POOL_ID` | From AWS Cognito console |
| `COGNITO_CLIENT_ID` | From Cognito App Client |
| `COGNITO_REGION` | e.g. `us-east-1` |
| `ADMIN_EMAIL` | Email address that gets admin access |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `https://your-app.vercel.app`) |
| `NODE_ENV` | Set to `production` |
