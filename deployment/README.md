# Deployment Scripts

One-time and maintenance scripts for populating the production environment.
All scripts read credentials from `.env.local` at the repo root.

## Setup

Create `.env.local` with:
```
DATABASE_URL="postgresql://..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
ADMIN_SECRET="..."
```

## Scripts

### 1. Import players
Reads `fifa_data/data/players.json` and inserts players into the Photo table.
Uses FIFA CDN URLs initially — run `upload:photos` afterwards to migrate to Blob.

```bash
npm run import:players             # all teams
npm run import:players -- --team usa  # single team
```

### 2. Upload photos to Vercel Blob
Uploads local headshots from `fifa_data/data/photos/` to Vercel Blob
and updates the DB URLs. Run after `import:players`.

```bash
npm run upload:photos              # all teams
npm run upload:photos -- --team usa   # single team
```

## Order of operations (first deploy)

```bash
npm run import:players   # populate DB with player data
npm run upload:photos    # migrate photos to Vercel Blob
```
