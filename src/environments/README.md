# Environment Setup

This project uses environment configuration files to store sensitive data like API keys and license keys.

## First-Time Setup

1. Copy the environment template:
   ```bash
   cp src/environments/environment.template.ts src/environments/environment.ts
   ```

2. Open `src/environments/environment.ts` and replace `YOUR_CKEDITOR_LICENSE_KEY_HERE` with your actual CKEditor license key.

3. The `environment.ts` file is gitignored and will not be committed to the repository.

## What's Included

- `environment.template.ts` - Template file (committed to repo)
- `environment.ts` - Your local config with secrets (gitignored)
- `environment.prod.ts` - Production config (gitignored, set via CI/CD)

## Getting a CKEditor License Key

For development, you can:
- Use the trial key from the CKEditor website
- Request a key from your team lead
- Visit: https://ckeditor.com/

## Important

⚠️ **Never commit actual license keys or API keys to the repository!**
