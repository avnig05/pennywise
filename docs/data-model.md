# Data Model (WIP)

Target DB: Supabase Postgres

## Tables (MVP)

### profiles
Stores onboarding answers and preferences.
- `user_id` (PK, references auth user)
- `created_at`, `updated_at`
- Example fields: `level`, `goals`, `income_type`, `loan_status`, `interests`

### topics
Curated topics shown in the dashboard.
- `id` (PK)
- `title`
- `tags`
- `difficulty`
- `summary`

### chats
Conversation containers.
- `id` (PK)
- `user_id`
- `created_at`

### messages
Individual chat messages.
- `id` (PK)
- `chat_id`
- `role` (user/assistant)
- `content`
- `created_at`

### citations
Links an assistant message to sources.
- `id` (PK)
- `message_id`
- `title`
- `url`
- `snippet`

## Later (RAG / knowledge base)
- `sources`
- `documents`
- `chunks`
- `embeddings` (pgvector)
