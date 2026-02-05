# API Contract (WIP)

Base URL (local): `http://localhost:8000`

## Auth
Requests that require a user must include a valid Supabase JWT (bearer token).
Exact verification details will be finalized during backend scaffold.

## Endpoints (initial)

### Health
- **GET** `/health`
  - Response: `{ "status": "ok" }`

### Profile
- **GET** `/me`
  - Returns the current user's profile
- **PUT** `/me`
  - Updates onboarding fields

### Topics
- **GET** `/topics/recommended`
  - Returns a list of recommended topics for the user profile

### Chat (stub first, real later)
- **POST** `/chat`
  - Input: `{ "message": "...", "topic_id": "..." }`
  - Output:
    ```json
    {
      "answer": "...",
      "citations": [
        { "title": "...", "url": "...", "snippet": "..." }
      ],
      "disclaimer": "Educational only, not financial advice."
    }
    ```

## Notes
- Citations should exist even in the first demo (can be stubbed initially).
- Keep payloads stable to unblock frontend development early.
