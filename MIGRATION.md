# SkillPort Server Migration Plan

## Overview

This document outlines the plan for consolidating the multiple server implementations in the SkillPort project into a single, unified server structure. The goal is to improve maintainability, reduce redundancy, and ensure consistent functionality across the application.

## Current Structure

The project currently has three server implementations:

1. **Main Server** (`/server`): The primary, most comprehensive implementation with full functionality.
2. **Nested Server** (`/server/server`): A simplified version with similar but less comprehensive functionality.
3. **Backend Server** (`/backend`): A specialized implementation focused on handling extension submissions.

## Migration Steps

### 1. Consolidate Server Implementations

- ✅ **Keep the main `/server` folder** as the primary implementation
- ✅ **Migrate unique functionality** from the nested server and backend server
  - Added platform-specific username fields to the Submission model
  - Updated the extension endpoint to handle platform-specific usernames
- ✅ **Update the extension configuration** to point to the correct endpoints
  - Updated all endpoint URLs from `http://localhost:3001/api/submissions` to `http://localhost:5000/api/submissions/extension`

### 2. Archive Redundant Implementations

After verifying that all functionality has been successfully migrated, archive the redundant server implementations:

```bash
# Create an archive directory if it doesn't exist
mkdir -p archive

# Move the nested server and backend to the archive
mv server/server archive/nested-server
mv backend archive/backend-server
```

Alternatively, you can simply delete these directories if you're confident that all functionality has been migrated:

```bash
# Remove redundant server implementations
rm -rf server/server
rm -rf backend
```

### 3. Update Documentation

- ✅ Update the README.md to reflect the new structure
- ✅ Create this migration document to explain the changes

## Testing After Migration

After completing the migration, test the following functionality to ensure everything works correctly:

1. **Extension Submission**
   - Test submissions from LeetCode, GeeksforGeeks, and Codeforces
   - Verify that platform-specific usernames are correctly stored

2. **API Endpoints**
   - Test all API endpoints to ensure they're functioning correctly
   - Pay special attention to the `/api/submissions/extension` endpoint

3. **User Authentication**
   - Test user registration, login, and authentication

4. **Dashboard Functionality**
   - Test student, mentor, and admin dashboards

## Rollback Plan

If issues are encountered after migration, you can restore the original structure from the archived directories:

```bash
# Restore from archive
mv archive/nested-server server/server
mv archive/backend-server backend
```

Alternatively, if you're using version control, you can revert to the previous state.

## Benefits of Migration

- **Simplified Codebase**: Single source of truth for server functionality
- **Improved Maintainability**: Easier to update and maintain a single server implementation
- **Consistent Configuration**: Single configuration for all server functionality
- **Reduced Resource Usage**: Only one server process needs to run
- **Clearer Documentation**: Documentation can focus on a single server implementation