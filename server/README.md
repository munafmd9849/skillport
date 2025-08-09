# SkillPort Server

## Submission Model Changes

The Submission model has been updated to support the simplified data format sent by the browser extension while maintaining backward compatibility with the existing application.

### Core Fields (from Extension)

- `username`: The username of the user on the coding platform
- `email`: The email of the user (required)
- `url`: The URL of the problem/submission
- `slug`: The slug/identifier of the problem
- `timestamp`: When the submission was made
- `platform`: The coding platform (leetcode, geeksforgeeks, hackerrank, codeforces)
- `attempts`: Number of attempts (default: 1)

### Extended Fields (for Application)

- `problemTitle`: The title of the problem
- `problemUrl`: The URL of the problem (copied from `url` if not provided)
- `difficulty`: The difficulty level (easy, medium, hard)
- `status`: The status of the submission (solved, reattempt, doubt, in-progress)
- `solution`: The solution code
- `language`: The programming language used
- `timeComplexity`: The time complexity of the solution
- `spaceComplexity`: The space complexity of the solution
- `notes`: Additional notes
- `tags`: Array of tags

## New API Endpoints

### POST /api/submissions/extension

A new endpoint has been added specifically for the browser extension to submit data without requiring authentication. This endpoint accepts the simplified data format and handles the mapping to the full model.

**Required fields:**
- `email`: The user's email
- `platform`: The coding platform
- `url`: The URL of the problem/submission

**Example request:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "url": "https://leetcode.com/problems/two-sum/",
  "slug": "two-sum",
  "timestamp": "2023-06-15T12:34:56Z",
  "platform": "leetcode",
  "attempts": 1
}
```

### POST /api/submissions/bulk

The bulk submission endpoint has been updated to handle the simplified data format. It requires authentication and accepts an array of submissions.

## Extension Configuration

The browser extension has been updated to use the new server endpoint with a fallback to the legacy backend endpoint if the server is not available.

```javascript
// Configuration for backend endpoints
const CONFIG = {
  // Primary endpoint (server implementation)
  serverEndpoint: "http://localhost:5000/api/submissions/extension",
  // Fallback endpoint (legacy backend implementation)
  backendEndpoint: "http://localhost:3001/api/submissions"
};
```