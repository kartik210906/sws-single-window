const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const upload = require('../middleware/fileUploader');

// GET request to fetch dynamic structure config
router.get('/:formId/schema', formController.getFormSchema);

// POST request to submit response. Accepts multi-part/formdata with any files.
router.post('/:formId/submit', upload.any(), formController.submitForm);

module.exports = router;
