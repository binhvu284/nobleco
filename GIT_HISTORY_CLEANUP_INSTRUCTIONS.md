# Git History Cleanup Instructions

## 🚨 IMPORTANT: Clean Git History to Remove Exposed Secrets

Your git history contains exposed secrets that need to be removed:
- Supabase Service Role JWT (CRITICAL - full database access)
- Supabase ANON JWT
- Sepay API Key
- Supabase Project URL

## Prerequisites

### Install git-filter-repo

**Option 1: Using pip (Recommended)**
```bash
pip3 install git-filter-repo
# or
pip install git-filter-repo
```

**Option 2: Using Homebrew (macOS)**
```bash
brew install git-filter-repo
```

**Option 3: Manual Installation**
```bash
# Download from: https://github.com/newren/git-filter-repo
# Or clone and add to PATH
```

## Step-by-Step Cleanup Process

### Step 1: Backup Your Repository

```bash
# Create a backup branch (just in case)
git branch backup-before-cleanup

# Or clone to a backup location
cd ..
git clone Nobleco Nobleco-backup
cd Nobleco
```

### Step 2: Run the Cleanup Script

```bash
# Make sure you're in the repository root
cd "D:/[PERSONAL PROJECT FILES]/Nobleco"

# Run the cleanup script
./clean-git-history-simple.sh
```

The script will:
1. Check if git-filter-repo is installed
2. Ask for confirmation (type 'yes' to continue)
3. Replace all exposed secrets with `[REDACTED-...]` in git history
4. Clean up temporary files

### Step 3: Review Changes

```bash
# Check the cleaned history
git log --all --oneline | head -20

# Verify secrets are removed
git log --all --full-history -p | grep -i "REDACTED" | head -10
```

### Step 4: Force Push to Remote

⚠️ **WARNING: This rewrites git history on remote!**

```bash
# Force push all branches
git push --force --all

# Force push tags (if any)
git push --force --tags
```

### Step 5: Notify Team Members

If you have team members:
1. **They must re-clone the repository** (their local copies will be out of sync)
2. **Any forks/clones will be out of sync** and need to be updated
3. **CI/CD pipelines** may need to be updated if they reference specific commits

## Alternative: Manual Cleanup

If the script doesn't work, you can manually clean history:

```bash
# Install git-filter-repo first
pip3 install git-filter-repo

# Create replacement file
cat > /tmp/replacements.txt << 'EOF'
[REDACTED-SUPABASE-SERVICE-ROLE-KEY]==>[REDACTED-SUPABASE-SERVICE-ROLE-KEY]
[REDACTED-SUPABASE-ANON-KEY]==>[REDACTED-SUPABASE-ANON-KEY]
https://your-project-ref.supabase.co==>https://your-project-ref.supabase.co
[REDACTED-SEPAY-API-KEY]==>[REDACTED-SEPAY-API-KEY]
EOF

# Run git-filter-repo
git filter-repo --replace-text /tmp/replacements.txt --force

# Clean up
rm /tmp/replacements.txt
```

## Verification

After cleanup, verify secrets are removed:

```bash
# Check for exposed Supabase Service Role JWT
git log --all --full-history -p | grep -i "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" | wc -l
# Should return 0

# Check for exposed Sepay API key
git log --all --full-history -p | grep -i "[REDACTED-SEPAY-API-KEY]" | wc -l
# Should return 0

# Check that replacements are in place
git log --all --full-history -p | grep -i "REDACTED" | head -5
# Should show [REDACTED-...] entries
```

## Troubleshooting

### Error: "git-filter-repo: command not found"
- Install git-filter-repo: `pip3 install git-filter-repo`
- Make sure it's in your PATH

### Error: "fatal: not a git repository"
- Make sure you're in the repository root directory
- Run: `cd "D:/[PERSONAL PROJECT FILES]/Nobleco"`

### Error: "fatal: refs/remotes/origin/HEAD: cannot lock ref"
- This is normal after git-filter-repo
- Run: `git push --force --all` to fix

### After cleanup, git status shows many changes
- This is normal - git-filter-repo rewrites history
- Commit and push: `git add -A && git commit -m "Clean git history" && git push --force --all`

## Important Notes

1. **This operation is irreversible** - make sure you have backups
2. **Force push rewrites remote history** - coordinate with team
3. **All clones/forks will be out of sync** - team members must re-clone
4. **CI/CD pipelines** may break if they reference old commits
5. **GitHub/GitLab** may still show old commits in web UI temporarily

## After Cleanup

1. ✅ Verify secrets are removed from history
2. ✅ Force push to remote
3. ✅ Update local .env file with new keys (use `./setup-env.sh`)
4. ✅ Monitor Supabase/Sepay logs for unauthorized access
5. ✅ Set up pre-commit hooks to prevent future secret commits

---

**Last Updated:** December 8, 2025

