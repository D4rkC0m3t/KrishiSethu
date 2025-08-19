# Inventory Management System

A modern inventory management system for fertilizer shops built with React and Supabase.

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase CLI (`npm install -g supabase`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

4. **Start local Supabase**
   ```bash
   supabase start
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🛠️ Creating Migrations

1. **Create a new migration**
   ```bash
   supabase migration new migration_name
   ```

2. **Apply migrations locally**
   ```bash
   supabase db push
   ```

## 🔄 Deployment

The project uses GitHub Actions for CI/CD. Pushing to different branches triggers different environments:

- `develop` → Deploys to staging environment
- `main` → Deploys to production environment

### Required Secrets

Add these to your GitHub repository secrets:

- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token
- `SUPABASE_PROJECT_REF` - Your Supabase project reference
- `SUPABASE_DB_URL` - Your Supabase database URL
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## 📦 Project Structure

```
.
├── .github/workflows/  # CI/CD workflows
├── public/            # Static files
├── src/               # Application source code
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   └── lib/           # Core libraries
└── supabase/          # Supabase configurations
    └── migrations/    # Database migrations
```

## 📝 License

MIT
