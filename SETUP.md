# Study AI Setup Guide

## Step 1: Install PostgreSQL

### Option A: Download and Install PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Download the Windows installer (version 15 or 16)
3. Run the installer with these settings:
   - Username: `postgres` (default)
   - Password: `password123` (or remember whatever you choose)
   - Port: `5432` (default)
   - Install additional tools: ✅ Yes

### Option B: Use Docker (if you prefer)
1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run this command:
   ```powershell
   docker run --name study-ai-postgres -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=study_ai_db -p 5432:5432 -d postgres:15
   ```

## Step 2: Create Database and Tables

### After PostgreSQL is installed:

**Method 1: Using pgAdmin (GUI - Easier)**
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your PostgreSQL server (password: password123)
3. Right-click "Databases" → Create → Database
4. Name: `study_ai_db`
5. Right-click the new database → Query Tool
6. Copy and paste the entire content of `database/schema.sql`
7. Click Execute (▶️ button)
8. Optional: Run `database/sample_data.sql` for test data

**Method 2: Using Command Line**
```powershell
# Open PowerShell in your project directory
cd "C:\Users\Alecs\OneDrive\ETH\Programs\Study-AI-main"

# Create database
psql -U postgres -c "CREATE DATABASE study_ai_db;"

# Run schema
psql -U postgres -d study_ai_db -f "database/schema.sql"

# Load sample data (optional)
psql -U postgres -d study_ai_db -f "database/sample_data.sql"
```

## Step 3: Get AI API Keys (Choose at least one)

### OpenAI (Recommended)
1. Go to: https://platform.openai.com/api-keys
2. Sign up/Login
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### Google Gemini (Alternative)
1. Go to: https://makersuite.google.com/app/apikey
2. Create an API key
3. Copy the key

### Anthropic Claude (Alternative)
1. Go to: https://console.anthropic.com/
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

## Step 4: Update Environment Variables

Edit `backend/.env` file and replace the placeholder API keys:

```properties
# Replace this line:
OPENAI_API_KEY=sk-your_openai_api_key_here

# With your actual key:
OPENAI_API_KEY=sk-proj-abc123your_real_key_here
```

**Important**: If you used a different PostgreSQL password, update these lines in `.env`:
```properties
DB_PASSWORD=your_actual_password
DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/study_ai_db
```

## Step 5: Test the Setup

```powershell
# Start the backend
cd backend
npm run dev

# If successful, you should see:
# "🚀 Study AI Backend running on port 3001"
# "📊 Health check: http://localhost:3001/health"
```

## Troubleshooting

### PostgreSQL not found
- Restart PowerShell after installing PostgreSQL
- Check if PostgreSQL is in your PATH: `echo $env:PATH`
- Try the full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe" --version`

### Database connection errors
- Check if PostgreSQL service is running (Services.msc → PostgreSQL)
- Verify password in `.env` matches what you set during installation
- Try connecting manually: `psql -U postgres -d study_ai_db`

### API Key errors
- Make sure you have billing set up for OpenAI
- Check API key format (should start with `sk-` for OpenAI)
- Verify no extra spaces in the `.env` file