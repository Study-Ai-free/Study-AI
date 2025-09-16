# PostgreSQL Database Setup Script for Study AI
# Run this script after installing PostgreSQL

# Step 1: Create the database (run this in psql or pgAdmin)
# Connect to PostgreSQL as the postgres user:
# psql -U postgres

# Then run:
CREATE DATABASE study_ai_db;

# Step 2: Connect to the new database
# \c study_ai_db

# Step 3: Create the schema (copy and paste the content of schema.sql)
# Or run: \i C:\path\to\your\Study-AI-main\database\schema.sql

# Step 4: Load sample data (optional)
# \i C:\path\to\your\Study-AI-main\database\sample_data.sql

# Alternative: Run from command line after installing PostgreSQL
# psql -U postgres -c "CREATE DATABASE study_ai_db;"
# psql -U postgres -d study_ai_db -f "C:\Users\Alecs\OneDrive\ETH\Programs\Study-AI-main\database\schema.sql"
# psql -U postgres -d study_ai_db -f "C:\Users\Alecs\OneDrive\ETH\Programs\Study-AI-main\database\sample_data.sql"