#!/bin/bash
# Remove secrets from git history completely
# This script removes files containing secrets from ALL git history

set -e

echo "🔍 Removing secrets from git history"
echo "===================================="
echo ""

# Check if git-filter-repo is available
if ! python3 -m git_filter_repo --version &> /dev/null; then
    echo "❌ git-filter-repo is not installed."
    echo "Installing..."
    pip3 install git-filter-repo
fi

echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  This will remove the following files from ALL commits:"
echo "   - clean-git-history-simple.sh"
echo "   - clean-git-history.sh"
echo "   - .env.example (if it contains secrets)"
echo ""
read -p "Continue? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🧹 Removing files from git history..."

# Remove cleanup scripts completely from history
python3 -m git_filter_repo \
    --invert-paths \
    --path clean-git-history-simple.sh \
    --path clean-git-history.sh \
    --force

echo ""
echo "✅ Files removed from git history!"
echo ""
echo "📋 Next steps:"
echo "1. Force push to remote:"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - All team members must re-clone the repository"
echo "   - Any forks/clones will be out of sync"

