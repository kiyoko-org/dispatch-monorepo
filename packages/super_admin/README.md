# Dispatch Super Admin Frontend

## Installation

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun

### Setup

1. **Navigate to the project directory**:
```bash
cd super-admin-frontend
```

2. **Install dependencies**:
```bash
npm install
```
Or with yarn:
```bash
yarn install
```
Or with bun:
```bash
bun install
```

3. **Configure environment variables**:
```bash
cp .env.example .env.local
```

4. **Edit `.env.local` and add your credentials**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

5. **Run the development server**:
```bash
npm run dev
```
Or with yarn:
```bash
yarn dev
```
Or with bun:
```bash
bun dev
```

6. **Open your browser**:

Navigate to [http://localhost:3001](http://localhost:3001)

## Build for Production

```bash
npm run build
npm run start
```

---

That's it! The super admin dashboard is now running.
