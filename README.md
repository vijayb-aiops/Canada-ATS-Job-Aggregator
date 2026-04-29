# Canada ATS Job Aggregator

Next.js app for scanning ATS job boards, filtering Canada-focused AI/ML roles, saving scan results in Supabase, and exporting results to Excel.

## Requirements

- Node.js 20+
- npm or pnpm
- Supabase project
- Vercel project for deployment

## Environment Variables

Create `.env.local` in the project root for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from Supabase:

1. Open your Supabase project.
2. Go to `Project Settings` -> `API`.
3. Copy `Project URL` into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy `anon public` key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

These variables are required by the server actions that save scan history and export saved scans.

## Supabase Setup

The app expects two tables:

- `scans`
- `jobs`

The schema and row-level security policies are in:

```bash
supabase/migrations/20260125214216_create_jobs_and_scans_tables.sql
```

Apply the migration in one of these ways:

1. Supabase Dashboard SQL Editor:

```bash
supabase/migrations/20260125214216_create_jobs_and_scans_tables.sql
```

Open the file, paste the SQL into the Supabase SQL Editor, and run it.

2. Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

After migration, verify that `scans` and `jobs` exist under `Table Editor`.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

Run checks:

```bash
npm run type-check
npm run build
```

## Vercel Deployment

Add the same Supabase variables in Vercel:

1. Open the Vercel project.
2. Go to `Settings` -> `Environment Variables`.
3. Add:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. Select the environments where the variables should be available:

```bash
Production
Preview
Development
```

5. Redeploy the app after adding or changing environment variables.

Important: Vercel preview deployments can fail if the variables are only configured for production. Use `All Environments` unless you intentionally want different Supabase projects per environment.

## Troubleshooting

If the browser shows:

```text
An error occurred in the Server Components render...
```

Check the Vercel function logs. The production browser popup hides the real server error.

Common causes:

- `NEXT_PUBLIC_SUPABASE_URL` is missing in Vercel.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing in Vercel.
- Vercel preview environment does not have the same variables as production.
- Supabase `scans` and `jobs` tables were not created.
- Supabase RLS policies were not applied.
- Supabase project URL or anon key points to the wrong project.

If Vercel logs show:

```text
TypeError: fetch failed
```

Check that the Supabase URL is correct and reachable from Vercel. Also confirm the app was redeployed after env vars were updated.

## ATS Parser Configuration

ATS company sources are configured in:

```bash
data/ats-companies.json
```

Supported parser modules live in:

```bash
lib/scraper/parsers
```

Only ATS systems with parser code and configured company sources can return real jobs. Do not rely on UI labels alone; each ATS must have a parser and source configuration.
