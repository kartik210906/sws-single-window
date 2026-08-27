const FormSchema = require('../models/FormSchema');
const FormSubmission = require('../models/FormSubmission');
const fs = require('fs');

// Retrieve active form structure by Schema ID
exports.getFormSchema = async (req, res) => {
  try {
    const { formId } = req.params;
    const schema = await FormSchema.findOne({ _id: formId, isActive: true });
    
    if (!schema) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form schema not found or is currently inactive.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: schema 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve form schema.', 
      error: error.message 
    });
  }
};

// Handle Form Submission with full server-side validation matching the Mongoose schema
exports.submitForm = async (req, res) => {
  const uploadedFiles = req.files || [];
  
  // Helper function to clean up uploaded files on validation failures
  const cleanupFiles = () => {
    uploadedFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  };

  try {
    const { formId } = req.params;
    // In production, the userId is extracted from JWT middleware (e.g., req.user.id)
    const { userId = 'sih_user_test_99' } = req.body; 

    // 1. Fetch the active schema to validate against
    const schema = await FormSchema.findOne({ _id: formId, isActive: true });
    if (!schema) {
      cleanupFiles();
      return res.status(404).json({ success: false, message: 'Matching active form schema not found.' });
    }

    // 2. Map all fields in the schema for rapid access
    const fieldsMap = {};
    schema.sections.forEach(section => {
      section.fields.forEach(field => {
        fieldsMap[field.fieldId] = field;
      });
    });

    const validationErrors = {};
    const processedSubmissionData = [];

    // 3. Loop through fields to validate input values
    for (const [fieldId, fieldConfig] of Object.entries(fieldsMap)) {
      const isFileField = fieldConfig.type === 'file';

      if (isFileField) {
        // Find if a file was uploaded for this field
        const file = uploadedFiles.find(f => f.fieldname === fieldId);
        
        if (fieldConfig.validation?.required && !file) {
          validationErrors[fieldId] = 'This document/file is required.';
          continue;
        }

        if (file) {
          const reqs = fieldConfig.fileRequirements || { maxSizeInMb: 5, allowedTypes: [] };
          const fileSizeInMb = file.size / (1024 * 1024);
          
          // Verify File Size limits
          if (fileSizeInMb > reqs.maxSizeInMb) {
            validationErrors[fieldId] = `File size exceeds the limit of ${reqs.maxSizeInMb}MB.`;
            continue;
          }

          // Verify MIME types
          if (reqs.allowedTypes.length > 0 && !reqs.allowedTypes.includes(file.mimetype)) {
            validationErrors[fieldId] = `Invalid file type. Allowed types: ${reqs.allowedTypes.join(', ')}.`;
            continue;
          }

          // Record metadata for successful uploads
          processedSubmissionData.push({
            fieldId: fieldId,
            value: null,
            fileMetadata: {
              originalName: file.originalname,
              mimeType: file.mimetype,
              url: `/uploads/${file.filename}`, // In production, this stores the Cloud Storage URL
              sizeBytes: file.size
            }
          });
        }
      } else {
        // Handle non-file fields (text, numbers, checkboxes, radios, dates)
        let fieldValue = req.body[fieldId];
        
        // Parse checkboxes array if submitted as serialized JSON string
        if (fieldConfig.type === 'checkbox' && typeof fieldValue === 'string') {
          try {
            fieldValue = JSON.parse(fieldValue);
          } catch (e) {
            // Leave as string or split by comma if parse fails
            fieldValue = fieldValue ? fieldValue.split(',') : [];
          }
        }

        const isValueEmpty = fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

        // Required Check
        if (fieldConfig.validation?.required && isValueEmpty) {
          validationErrors[fieldId] = 'This field is required.';
          continue;
        }

        if (!isValueEmpty) {
          // Range check for Numbers
          if (fieldConfig.type === 'number') {
            const numericVal = Number(fieldValue);
            if (isNaN(numericVal)) {
              validationErrors[fieldId] = 'Must be a valid number.';
              continue;
            }
            if (fieldConfig.validation?.min !== undefined && numericVal < fieldConfig.validation.min) {
              validationErrors[fieldId] = `Minimum value allowed is ${fieldConfig.validation.min}.`;
              continue;
            }
            if (fieldConfig.validation?.max !== undefined && numericVal > fieldConfig.validation.max) {
              validationErrors[fieldId] = `Maximum value allowed is ${fieldConfig.validation.max}.`;
              continue;
            }
          }

          // Length checks for strings (text/textarea)
          if (typeof fieldValue === 'string' && (fieldConfig.type === 'text' || fieldConfig.type === 'textarea')) {
            if (fieldConfig.validation?.min !== undefined && fieldValue.length < fieldConfig.validation.min) {
              validationErrors[fieldId] = `Must contain at least ${fieldConfig.validation.min} characters.`;
              continue;
            }
            if (fieldConfig.validation?.max !== undefined && fieldValue.length > fieldConfig.validation.max) {
              validationErrors[fieldId] = `Must not exceed ${fieldConfig.validation.max} characters.`;
              continue;
            }
          }

          // Regex pattern matching (e.g., PAN card: [A-Z]{5}[0-9]{4}[A-Z]{1})
          if (fieldConfig.validation?.pattern && typeof fieldValue === 'string') {
            const regex = new RegExp(fieldConfig.validation.pattern);
            if (!regex.test(fieldValue)) {
              validationErrors[fieldId] = fieldConfig.validation.customMessage || 'Invalid input format.';
              continue;
            }
          }

          // Save validated text value
          processedSubmissionData.push({
            fieldId: fieldId,
            value: fieldValue,
            fileMetadata: null
          });
        }
      }
    }

    // 4. Return errors if any field fails validation
    if (Object.keys(validationErrors).length > 0) {
      cleanupFiles();
      return res.status(400).json({ 
        success: false, 
        message: 'Form validation failed.', 
        errors: validationErrors 
      });
    }

    // 5. Save submission to MongoDB
    const submission = new FormSubmission({
      formSchemaId: formId,
      userId: userId,
      status: 'SUBMITTED',
      data: processedSubmissionData,
      submittedAt: new Date()
    });

    await submission.save();

    return res.status(201).json({
      success: true,
      message: 'Form submission processed and saved successfully.',
      submissionId: submission._id
    });

  } catch (error) {
    cleanupFiles();
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error encountered while saving submission.', 
      error: error.message 
    });
  }
};
