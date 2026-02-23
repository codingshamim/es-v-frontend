# Authentication Setup Guide

This document outlines the complete authentication system setup for the ES VIBES project using NextAuth.js (beta) with MongoDB, Email/Password, Google OAuth, and Facebook OAuth.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Dependencies](#dependencies)
3. [Environment Variables](#environment-variables)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Facebook OAuth Setup](#facebook-oauth-setup)
6. [NextAuth Configuration](#nextauth-configuration)
7. [User Model](#user-model)
8. [Registration Flow](#registration-flow)
9. [Testing](#testing)
10. [Production Deployment](#production-deployment)

---

## 🗄️ Database Setup

### MongoDB Collection Indexes

The User model automatically creates the following indexes for optimal performance:

```javascript
db.users.createIndex({ email: 1 });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ googleId: 1 });
db.users.createIndex({ facebookId: 1 });
db.users.createIndex({ createdAt: -1 });
```

### MongoDB Atlas Setup (Recommended for Production)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Add a database user with:
   - Username: `esfitt_user`
   - Password: Generate a strong password
5. Whitelist your IP address
6. Get your connection string in format:
   ```
   mongodb+srv://esfitt_user:password@cluster.mongodb.net/es-vibes?retryWrites=true&w=majority
   ```

### Local MongoDB Setup

For development, install MongoDB locally:

**Windows:**

```bash
# Using Chocolatey
choco install mongodb-community

# Or download from https://www.mongodb.com/try/download/community
```

**macOS:**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**

```bash
curl https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## 📦 Dependencies

All required dependencies have been added to `package.json`. Install them with:

```bash
npm install
```

Key packages:

- **next-auth@5.0.0-beta.20** - Authentication framework
- **mongoose@9.2.1** - MongoDB ODM
- **bcryptjs@3.0.3** - Password hashing
- **react-hook-form@7.51.3** - Form handling
- **zod@3.22.4** - Schema validation

---

## 🔐 Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Edit `.env.local` with your values:

```dotenv
# MongoDB Database
MONGO_URI=mongodb://localhost:27017/es-vibes
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/es-vibes?retryWrites=true&w=majority

# NextAuth - Generate with: openssl rand -base64 32
AUTH_SECRET=your_generated_secret
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=your_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_client_secret

# Facebook OAuth
AUTH_FACEBOOK_ID=your_app_id
AUTH_FACEBOOK_SECRET=your_app_secret

# Email Service (Optional)
SMTP_FROM=noreply@esfitt.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Generate AUTH_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🔵 Google OAuth Setup

### Step-by-Step Instructions

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a Project" → "New Project"
   - Enter name: "ES VIBES"
   - Click "Create"

2. **Enable OAuth Consent Screen:**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type
   - Click "Create"
   - Fill in the form:
     - App name: `ES VIBES`
     - User support email: `your-email@gmail.com`
     - Developer contact: `your-email@gmail.com`
   - Click "Save and Continue"

3. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click "Create"
   - Copy your Client ID and Client Secret

4. **Add to .env.local:**
   ```dotenv
   AUTH_GOOGLE_ID=your_client_id
   AUTH_GOOGLE_SECRET=your_client_secret
   ```

---

## 📘 Facebook OAuth Setup

### Step-by-Step Instructions

1. **Create a Facebook App:**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "My Apps" → "Create App"
   - Choose "Consumer" as app type
   - Fill in app details
   - Accept terms and create app

2. **Configure Facebook Login:**
   - In app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Platform: Choose "Web"
   - Enter Site URL: `http://localhost:3000`

3. **Get Credentials:**
   - Go to "Settings" → "Basic"
   - Copy your App ID and App Secret

4. **Configure OAuth Redirects:**
   - Go to "Facebook Login" → "Settings"
   - Add Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/callback/facebook`
     - `https://yourdomain.com/api/auth/callback/facebook` (production)

5. **Add to .env.local:**
   ```dotenv
   AUTH_FACEBOOK_ID=your_app_id
   AUTH_FACEBOOK_SECRET=your_app_secret
   ```

---

## 🔧 NextAuth Configuration

The NextAuth configuration is in `lib/auth/auth.config.ts` and includes:

- **Credentials Provider** - Email/Phone + Password login
- **Google Provider** - OAuth 2.0 login
- **Facebook Provider** - OAuth login
- **JWT Strategy** - Session management
- **Custom Callbacks** - Social login integration

### Key Features:

✅ Form validation with Zod schemas  
✅ Password hashing with bcryptjs  
✅ Email/Phone uniqueness checks  
✅ Social OAuth account linking  
✅ Role-based access control (User/Admin/Moderator)  
✅ JWT-based sessions

---

## 👤 User Model

The User model (`lib/models/User.ts`) includes:

### Schema Fields

```typescript
{
  // Profile
  name: string (required, 2-50 chars)
  email: string (required, unique)
  phone: string (optional, unique, Bangladesh format)
  password: string (8+ chars, encrypted)
  profileImage: string (optional)
  bio: string (optional, max 500 chars)

  // Status
  role: enum('user', 'admin', 'moderator') // default: 'user'
  isEmailVerified: boolean (default: false)
  isPhoneVerified: boolean (default: false)
  isActive: boolean (default: true)

  // Social Login
  googleId: string (optional, unique)
  facebookId: string (optional, unique)

  // Verification
  emailVerificationToken: string
  emailVerificationExpires: Date
  passwordResetToken: string
  passwordResetExpires: Date

  // Meta
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}
```

### Model Methods

```typescript
// Instance Methods
user.comparePassword(password); // Compare password hash
user.hashPassword(); // Hash password

// Static Methods
User.findByEmail(email); // Find user by email
User.findByPhoneAndEmail(phone, email); // Find by either
User.findBySocialId(provider, id); // Find by social ID
```

---

## 📝 Registration Flow

### 1. User Submits Registration Form

**Form Validation (Client-Side):**

- Name: 2-50 characters
- Email: Valid format
- Phone: Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)
- Password: 8+ chars, uppercase, lowercase, number

### 2. Server-Side Validation & Database Check

**`registerUser()` Server Action:**

- Validate with Zod schema
- Check email not exists
- Check phone not exists
- Hash password with bcryptjs (12 rounds)
- Create user in MongoDB

### 3. Verification

**Email Verification:**

- Generate 6-digit code
- Store hashed token
- Set 10-minute expiration
- Send verification code (backend ready)

### 4. Success Response

**On Success:**

- Return userId
- Redirect to verification page
- Display user confirmation

---

## 🧪 Testing

### Test Registration

```bash
npm run dev
# Navigate to http://localhost:3000/register
```

**Test Cases:**

1. **Valid Registration**
   - Name: "Ahmed Ali"
   - Email: "ahmed@example.com"
   - Phone: "+8801712345678"
   - Password: "SecurePass123"
   - Should succeed

2. **Weak Password**
   - Password: "pass"
   - Should show validation error

3. **Invalid Phone**
   - Phone: "123456"
   - Should show validation error

4. **Duplicate Email**
   - Use existing email
   - Should show "Email already taken"

### Test Social Login (Google)

1. On login page, click "গুগল দিয়ে লগিন করুন"
2. Select Google account
3. Should redirect and create/link account

### Test Social Login (Facebook)

1. On login page, click "ফেসবুক দিয়ে লগিন করুন"
2. Enter credentials
3. Should redirect and create/link account

---

## 🚀 Production Deployment

### Prerequisites

- MongoDB Atlas cluster
- Google OAuth credentials
- Facebook OAuth credentials
- Vercel/Netlify/Custom server

### Environment Variables (Production)

```dotenv
# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/es-vibes?retryWrites=true&w=majority

# NextAuth
AUTH_SECRET=your_production_secret
AUTH_URL=https://yourdomain.com

# OAuth
AUTH_GOOGLE_ID=your_production_google_id
AUTH_GOOGLE_SECRET=your_production_google_secret
AUTH_FACEBOOK_ID=your_production_facebook_id
AUTH_FACEBOOK_SECRET=your_production_facebook_secret

# Email Service
SMTP_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# App
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Deployment Steps (Vercel)

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Add authentication system"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Connect GitHub repo
   - Add environment variables
   - Deploy

3. **Update OAuth Redirects:**
   - Google: Add `https://yourdomain.vercel.app/api/auth/callback/google`
   - Facebook: Add `https://yourdomain.vercel.app/api/auth/callback/facebook`

### Security Checklist

- [ ] AUTH_SECRET is strong and randomly generated
- [ ] AUTH_URL matches your domain
- [ ] Database backups enabled
- [ ] SSL/TLS enabled
- [ ] Rate limiting on auth endpoints
- [ ] Email notifications configured
- [ ] Monitoring set up
- [ ] Regular security updates

---

## 📚 File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth route handlers
│   ├── register/
│   │   ├── RegisterForm.tsx           # Registration form (updated)
│   │   ├── verify/
│   │   │   └── page.tsx              # Email verification page
│   │   └── page.tsx
│   ├── login/
│   │   └── LoginForm.tsx              # Will be updated
│   └── actions/
│       └── auth.ts                    # Server actions
├── lib/
│   ├── auth/
│   │   └── auth.config.ts             # NextAuth config
│   ├── models/
│   │   └── User.ts                    # User model (NEW)
│   ├── validation.ts                  # Validation schemas (NEW)
│   └── db/
│       └── connectDB.ts
├── components/
│   └── providers.tsx                  # Updated with SessionProvider
├── .env.local                         # Environment variables
└── package.json                       # Updated dependencies
```

---

## 🔗 Useful Links

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Facebook Developers](https://developers.facebook.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

## 💡 Tips & Best Practices

1. **Password Strength:**
   - Always validate on both client and server
   - Use strong hashing (bcryptjs with 12+ rounds)
   - Never log passwords

2. **Security:**
   - Enable rate limiting on auth endpoints
   - Use HTTPS/SSL in production
   - Implement CSRF protection
   - Keep dependencies updated

3. **User Experience:**
   - Real-time validation feedback
   - Clear error messages
   - Loading states for async operations
   - Email verification before full access

4. **Database:**
   - Regular backups
   - Index frequently queried fields
   - Monitor connection limits
   - Use transactions for critical operations

---

## ⚠️ Troubleshooting

### "MONGO_URI not defined"

- Check `.env.local` file exists
- Verify MONGO_URI is set correctly
- Restart dev server

### "Google redirect_uri mismatch"

- Ensure Google OAuth redirect URI matches exactly
- Include protocol (http/https)
- Include port if needed (localhost:3000)

### "Email already taken"

- Check if user exists in database
- Verify email uniqueness index

### "Invalid phone format"

- Use Bangladesh format: 01XXXXXXXXX or +8801XXXXXXXXX
- Remove spaces/dashes

---

**Last Updated:** February 2026  
**Version:** 1.0.0
