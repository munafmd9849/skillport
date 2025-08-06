# SkillPort Backend Server

This is the backend server for the SkillPort Submission Tracker Extension.

## Features
- Accepts coding submission data from the browser extension
- Logs received data to the console
- Saves submissions to MongoDB

## Setup

1. **Clone the repository and navigate to the backend folder:**
   ```sh
   cd backend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your MongoDB URI:
     ```sh
     cp .env.example .env
     # Edit .env and set MONGODB_URI
     ```

4. **Start MongoDB** (if not already running):
   - For local development, you can use `mongod` or MongoDB Compass.

5. **Start the server:**
   ```sh
   npm run dev
   # or
   npm start
   ```

6. **Test the server:**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser. You should see `SkillPort Backend is running`.

## API

### POST `/api/submissions`
- Accepts JSON body with submission data in the simplified format:
  ```json
  {
    "username": "platform_username",
    "email": "user@example.com",
    "url": "https://platform.com/problem/slug",
    "slug": "problem-slug",
    "timestamp": "2023-06-15T12:34:56.789Z",
    "platform": "leetcode",
    "attempts": 1
  }
  ```

- The server maps this data to the appropriate fields in the database schema
- Platform-specific username fields are automatically populated based on the platform value



  ```
- Returns `{ success: true, message: 'Submission saved', data: ... }` on success.

## Database Schema

The MongoDB schema for submissions includes:

### Core Fields (New Format)
- `username`: The platform-specific username
- `email`: User's email address
- `url`: Full URL of the problem
- `slug`: Problem slug/identifier
- `timestamp`: Submission timestamp
- `platform`: Platform name (leetcode, codeforces, gfg)
- `attempts`: Number of submission attempts

### Legacy Fields (For Backward Compatibility)
- `problemTitle`: Title of the problem
- `problemSlug`: Legacy slug field
- `leetcodeUsername`: LeetCode-specific username
- `codeforcesUsername`: Codeforces-specific username
- `gfgUsername`: GeeksforGeeks-specific username
- `submissionTime`: Legacy timestamp field
- `language`: Programming language used
- `contestId`: Contest identifier (for platforms like Codeforces)

## Notes
- Make sure your extension is configured to send data to the correct backend URL (default: `http://localhost:3000`).
- You can view all submissions in your MongoDB database.