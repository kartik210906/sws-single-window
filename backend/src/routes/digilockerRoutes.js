const express = require('express');
const router = express.Router();
const digilockerController = require('../controllers/digilockerController');

// POST request to resolve identity matching parameters
router.post('/verify', digilockerController.verifyIdentityDocument);

module.exports = router;
