const mongoose = require('mongoose');

const ValidationRuleSchema = new mongoose.Schema({
  required: { 
    type: Boolean, 
    default: false 
  },
  min: { 
    type: Number,
    description: 'Minimum length for strings, or minimum value for numbers'
  },
  max: { 
    type: Number,
    description: 'Maximum length for strings, or maximum value for numbers'
  },
  pattern: { 
    type: String, 
    description: 'Regex pattern string for validating inputs (e.g., PAN card, Aadhaar, GSTIN)' 
  },
  customMessage: { 
    type: String, 
    description: 'User-facing error message when custom regex validation fails' 
  }
}, { _id: false });

const OptionSchema = new mongoose.Schema({
  label: { 
    type: String, 
    required: true 
  },
  value: { 
    type: String, 
    required: true 
  }
}, { _id: false });

const FileRequirementsSchema = new mongoose.Schema({
  maxSizeInMb: { 
    type: Number, 
    default: 5 
  },
  allowedTypes: { 
    type: [String], 
    default: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'MIME types allowed for upload'
  }
}, { _id: false });

const LayoutSchema = new mongoose.Schema({
  gridCols: { 
    type: Number, 
    enum: [3, 4, 6, 8, 12], 
    default: 12,
    description: 'Width of the field in a Tailwind 12-column layout grid' 
  }
}, { _id: false });

const FieldSchema = new mongoose.Schema({
  fieldId: { 
    type: String, 
    required: true, 
    description: 'Unique identifier used as key in submission payload (e.g., gst_number)' 
  },
  label: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true, 
    enum: [
      'text', 
      'number', 
      'textarea', 
      'select', 
      'radio', 
      'checkbox', 
      'file', 
      'date', 
      'email'
    ] 
  },
  placeholder: { 
    type: String, 
    default: '' 
  },
  defaultValue: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  options: [OptionSchema], // Utilized by select, radio, and checkbox fields
  validation: { 
    type: ValidationRuleSchema, 
    default: () => ({}) 
  },
  layout: { 
    type: LayoutSchema, 
    default: () => ({}) 
  },
  fileRequirements: { 
    type: FileRequirementsSchema, 
    default: null 
  }
}, { _id: true });

const SectionSchema = new mongoose.Schema({
  sectionId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  fields: [FieldSchema]
}, { _id: true });

const FormSchemaDef = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  version: { 
    type: Number, 
    default: 1 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  sections: [SectionSchema]
}, { 
  timestamps: true 
});

// Index to quickly check matching configurations
FormSchemaDef.index({ isActive: 1 });

module.exports = mongoose.model('FormSchema', FormSchemaDef);
