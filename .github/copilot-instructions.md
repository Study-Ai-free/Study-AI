# AI-Powered Study Assistant - Copilot Instructions

## Project Overview

This is an AI-powered learning platform that analyzes uploaded PDF documents and videos to generate personalized daily quizzes. The system tracks student performance to identify strengths and weaknesses, providing clear exam readiness insights.

## Architecture

### Core Components
- **Backend** (`/backend`): Node.js Express API with file processing and business logic
- **AI Engine** (`/ai-engine`): Multi-provider AI integration (OpenAI, Google, Anthropic) for content analysis and quiz generation
- **Frontend** (`/frontend`): React TypeScript dashboard with Material-UI
- **Database** (`/database`): PostgreSQL with comprehensive schema for users, subjects, content, quizzes, and analytics

### Key Design Patterns

**Multi-AI Provider Pattern**: The AI engine uses a provider manager with automatic failover. Always implement new AI features through the `ProviderManager` class rather than directly calling provider APIs.

**Subject Separation**: Users can have multiple subjects that must remain distinct. The database enforces subject separation at the user level - ensure all quiz generation respects subject boundaries.

**Performance Tracking**: The system maintains detailed analytics per topic and subject. When implementing new features, always consider how they impact the `performance_analytics` table.

## Development Workflows

### Backend Development
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev  # Starts on port 3001
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # Starts on port 3000, proxies API to 3001
```

### Database Setup
```bash
# Run PostgreSQL locally or use Docker
psql -U postgres -d study_ai_db -f database/schema.sql
psql -U postgres -d study_ai_db -f database/sample_data.sql
```

### AI Engine Testing
The AI engine requires API keys for at least one provider in `.env`:
- `OPENAI_API_KEY` for GPT models
- `GOOGLE_AI_API_KEY` for Gemini
- `ANTHROPIC_API_KEY` for Claude

## Project-Specific Conventions

### File Upload Processing
- PDF files use `pdf-parse` for text extraction
- Video files require FFmpeg for audio transcription
- All uploaded content goes through the AI engine for topic extraction
- File processing status tracked in `content.upload_status` field

### Quiz Generation Logic
- Quizzes are generated per subject with configurable difficulty (1-5)
- Question types: `multiple_choice`, `true_false`, `short_answer`, `essay`
- Each question links to a topic for performance tracking
- Quiz difficulty adapts based on historical performance

### Performance Analytics
- Daily aggregation in `performance_analytics` table
- Weak topics: accuracy < 60% with 3+ attempts
- Strong topics: accuracy ≥ 80% with 5+ attempts
- Trends calculated using rolling averages

### State Management (Frontend)
- Zustand for global state (`/frontend/src/store`)
- React Query for server state and caching
- Material-UI theme customization in `App.tsx`

## Critical Implementation Details

### AI Provider Fallback
```javascript
// Always use ProviderManager for AI operations
const result = await providerManager.executeWithFallback('analyzeContent', [content, subject]);
```

### Subject Context
```sql
-- Always filter by subject_id when querying user data
SELECT * FROM topics WHERE subject_id = ? AND user_id = ?;
```

### File Path Handling
- Upload directory: `backend/uploads/`
- File paths stored as relative paths in database
- Static serving configured in `backend/src/app.js`

### Quiz Response Tracking
Each quiz response must update:
1. `quiz_responses` table with user answer
2. `performance_analytics` aggregation
3. Topic-level accuracy calculations

## Integration Points

### AI Engine ↔ Backend
- Content processing endpoint: `POST /api/upload/process`
- Quiz generation endpoint: `POST /api/quiz/generate`
- Performance analysis: `GET /api/analytics/performance`

### Frontend ↔ Backend
- Authentication: JWT tokens in headers
- File uploads: multipart/form-data to `/api/upload`
- Real-time quiz taking: WebSocket connection for timer updates

### Database ↔ Application
- Connection pooling configured in backend
- Migrations in `/database/` directory
- Foreign key constraints enforce data integrity

## Testing Strategy

### Backend Tests
```bash
cd backend && npm test
```
- API endpoint testing with supertest
- AI engine mocking for consistent tests
- Database transactions for test isolation

### Frontend Tests
```bash
cd frontend && npm test
```
- Component testing with React Testing Library
- Mock API responses for UI testing
- Accessibility testing with jest-axe

## Common Gotchas

1. **AI Provider Rate Limits**: Always implement exponential backoff and use the fallback system
2. **File Size Limits**: Configure both Express and frontend for large file uploads (100MB default)
3. **Subject Isolation**: Never mix content or analytics across subjects for the same user
4. **UUID Usage**: All primary keys are UUIDs - use `uuid_generate_v4()` in SQL
5. **Time Zones**: All timestamps use `TIMESTAMP WITH TIME ZONE` for UTC storage

## Environment Variables

Essential variables for development:
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/study_ai_db

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=your-secret-key

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
```

When adding new features, always consider the multi-AI provider architecture, subject separation requirements, and performance tracking implications.