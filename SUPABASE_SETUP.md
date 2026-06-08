# Batcave Supabase Setup

## 1. Create a Supabase Project
Go to https://supabase.com → New project

## 2. Enable Google OAuth
Dashboard → Authentication → Providers → Google
- Add your Google OAuth Client ID and Secret
- (Get from: https://console.cloud.google.com → OAuth 2.0 Clients)

## 3. Create Storage Bucket
Dashboard → Storage → New Bucket
- Name: `batcave-backups`
- Public: No (private)

## 4. Add Environment Variables
Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 5. Restart Dev Server
```
npm run dev
```

The Data Vault will automatically show cloud sync options when configured.

## Notes
- The app runs fully offline without these env vars
- Local localStorage is always the source of truth
- Cloud sync is a backup/restore layer only
