#!/bin/bash
# Environment Setup Script
# Helps create .env file from template

set -e

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

echo "🔧 Nobleco Environment Setup"
echo "=========================="
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Overwrite? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi
fi

# Create .env from template if .env.example exists
if [ -f "$EXAMPLE_FILE" ]; then
    echo "📋 Creating .env from template..."
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "✅ Created $ENV_FILE from template"
    echo ""
    echo "⚠️  IMPORTANT: Update the following values in .env:"
    echo "   - SEPAY_API_KEY (get from https://my.sepay.vn)"
    echo "   - VITE_SUPABASE_URL (get from Supabase Dashboard)"
    echo "   - VITE_SUPABASE_ANON_KEY (get from Supabase Dashboard)"
    echo "   - SUPABASE_URL (same as VITE_SUPABASE_URL)"
    echo "   - SUPABASE_SERVICE_ROLE_KEY (get from Supabase Dashboard)"
    echo ""
    echo "⚠️  NEVER commit .env to git!"
else
    # Create basic .env template
    cat > "$ENV_FILE" << 'EOF'
# ============================================
# Nobleco Environment Variables
# ============================================
# ⚠️ SECURITY: Never commit this file to git!
# ============================================

# Sepay.vn API Key
SEPAY_API_KEY=your_sepay_api_key_here

# Application Base URL
NEXT_PUBLIC_BASE_URL=https://app.nobleco.vn

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Merchant Bank Account (Optional)
MERCHANT_BANK_NAME=MB
MERCHANT_BANK_CODE=970422
MERCHANT_BANK_ACCOUNT=your_account_number
MERCHANT_BANK_OWNER=Your Company Name

# Development Server Port
API_PORT=3001
EOF
    echo "✅ Created basic $ENV_FILE template"
    echo ""
    echo "⚠️  IMPORTANT: Fill in your actual values!"
fi

echo ""
echo "📝 Next steps:"
echo "1. Open .env file and fill in your actual values"
echo "2. Get Supabase keys from: https://app.supabase.com → Settings → API"
echo "3. Get Sepay API key from: https://my.sepay.vn → API Access"
echo ""
echo "✅ Setup complete!"

