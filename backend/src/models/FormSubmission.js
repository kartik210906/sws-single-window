const mongoose = require('mongoose');

const SubmissionFileMetadataSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  url: { type: String, required: true },
  sizeBytes: { type: Number, required: true }
}, { _id: false });

const SubmissionValueSchema = new mongoose.Schema({
  fieldId: { 
    type: String, 
    required: true 
  },
  // Accommodates dynamic structures: string (text/radio), number, arrays of strings (checkboxes)
  value: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  fileMetadata: { 
    type: SubmissionFileMetadataSchema, 
    default: null 
  }
}, { _id: false });

const FormSubmissionSchema = new mongoose.Schema({
  formSchemaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FormSchema', 
    required: true 
  },
  userId: { 
    type: String, 
    required: true, 
    index: true,
    description: 'Primary Key referencing user in the relational Auth database (PostgreSQL)' 
  },
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RE-SUBMISSION_REQUIRED'],
    default: 'DRAFT'
  },
  data: [SubmissionValueSchema],
  reviewedBy: { 
    type: String, 
    default: null 
  },
  reviewRemarks: { 
    type: String, 
    default: null 
  },
  submittedAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

// Composite index to prevent multiple submissions of the same form by a user if restricted,
// or for fast user status tracking queries.
FormSubmissionSchema.index({ formSchemaId: 1, userId: 1 });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);
