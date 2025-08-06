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
- Accepts JSON body with submission data:
  ```json
  {
    "email": "user@example.com",
    "platform": "leetcode",
    "problemTitle": "Two Sum",
    "problemSlug": "two-sum",
    "submissionTime": "2024-01-01T12:00:00.000Z",
    "attempts": 1,
    "language": "javascript",
    "contestId": "1234"
  }
  ```
- Returns `{ success: true, message: 'Submission saved', data: ... }` on success.

## Notes
- Make sure your extension is configured to send data to the correct backend URL (default: `http://localhost:3000`).
- You can view all submissions in your MongoDB database. 