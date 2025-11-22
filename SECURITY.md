# Security Policy and Public Release Checklist

This repository is designed to be safe for public GitHub. Follow the checklist below and the guidance to avoid exposing secrets or user data.

## Public Release Checklist

- Secrets:
  - Do not commit `.env` files or private keys. Use environment managers on your host.
  - Only commit `.env.example` as a reference.
- Databases:
  - Local SQLite files are ignored via `.gitignore` (`*.db`, `*.sqlite*`).
  - Confirm no database files are in history before making the repo public.
- Admin protection:
  - Admin endpoints require `ADMIN_TOKEN` (implemented server-side).
  - Set a strong token in production and rotate as needed.
- CORS:
  - Set `CORS_ORIGINS` in production to the exact frontend domains.
  - Avoid `*` in production.
- HTTPS:
  - Serve the backend behind HTTPS. Most hosts provide TLS out of the box.

## GitHub Security Features

Enable these repository features under Settings → Security:

- Secret scanning (GitHub Advanced Security)
- Secret scanning push protection
- Dependabot alerts (for vulnerable dependencies)
- Code scanning (optional, e.g., CodeQL)

## Cleaning Secrets from Git History

If any secrets or `.db` files were ever committed in the past, scrub them from history before making the repository public.

### Option A: git filter-repo (recommended)

1. Install: `brew install git-filter-repo` (macOS) or see https://github.com/newren/git-filter-repo
2. Run from repo root:

   ```bash
   git filter-repo --force \
     --invert-paths --path server/player_stats.db --path server/snake402.db \
     --path-glob "*.env" --path-glob "*.env.*" --path-glob "*.sqlite*" --path-glob "*.db"
   ```

3. Rotate any leaked tokens and replace them in your host environment.
4. Force-push rewritten history to private origin, then make public.

### Option B: BFG Repo-Cleaner

1. Download: https://rtyley.github.io/bfg-repo-cleaner/
2. Example to remove env files:

   ```bash
   java -jar bfg.jar --delete-files "*.env" --delete-files "*.env.*"
   java -jar bfg.jar --delete-files "*.sqlite*" --delete-files "*.db"
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```

## Reporting a Vulnerability

If you discover a security issue, please open a private issue or contact the maintainers directly. Do not open a public issue containing sensitive details.