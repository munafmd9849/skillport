const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticateToken, requireRole, canAccessBatch } = require('../middleware/auth');

// GET /api/batches - Role-based access
router.get('/', authenticateToken, batchController.getAllBatches);

// POST /api/batches - Admin only
router.post('/', authenticateToken, requireRole(['admin']), batchController.createBatch);

// PUT /api/batches/:id/assign - Admin only
router.put('/:id/assign', authenticateToken, requireRole(['admin']), batchController.assignUsers);

module.exports = router;
