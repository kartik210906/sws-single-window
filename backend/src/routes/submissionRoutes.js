const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Ingestion endpoint for routing submissions
router.post('/submit', submissionController.submitUnifiedForm);

// Query specific queue
router.get('/queue/:department', submissionController.getDepartmentQueue);

// Update status of specific queue item
router.patch('/queue/:department/:queueItemId', submissionController.updateQueueItemStatus);

module.exports = router;
