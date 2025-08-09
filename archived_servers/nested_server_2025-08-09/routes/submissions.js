const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/submissions - Role-based access
router.get('/', authenticateToken, submissionController.getSubmissions);

// POST /api/submissions - For browser extension
router.post('/', submissionController.addSubmission);

module.exports = router;
