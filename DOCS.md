# LumBarong API & Documentation

## Overview
LumBarong is a multi-vendor e-commerce platform dedicated to Lumban artisans.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, MySQL (Sequelize ORM)
- **Storage**: Cloudinary
- **Security**: JWT, BcryptJS, Helmet, Rate Limiter

## Installation
1. Clone the repo
2. **Backend**:
   ```bash
   cd backend
   npm install
   # Create .env with DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, CLOUDINARY_*
   npm run seed
   npm start
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Sign in
- `POST /api/v1/auth/create-seller` - (Admin only) Direct seller creation
- `GET /api/v1/auth/sellers` - (Admin only) Fetch sellers
- `PUT /api/v1/auth/approve-seller/:id` - (Admin only) Verify artisan shop

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - (Seller/Admin only) Add product
- `POST /api/v1/upload` - (Seller/Admin only) Upload image to Cloudinary

### Orders
- `POST /api/v1/orders` - Place order
- `GET /api/v1/orders` - My orders (User context dependent)
- `PUT /api/v1/orders/:id/status` - (Seller/Admin only) Update shipping progress

## Security
- All sensitive routes are protected by `authMiddleware` which enforces role-based access.
- Inputs are validated using `express-validator`.
- Passwords are salted and hashed.
- API requests are rate-limited to 100 per 15 mins.
