export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

export interface Option {
  label: string;
  value: string;
}

export interface FileRequirements {
  maxSizeInMb: number;
  allowedTypes: string[];
}

export interface Layout {
  gridCols: 3 | 4 | 6 | 8 | 12;
}

export interface Field {
  _id?: string;
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'date' | 'email';
  placeholder?: string;
  defaultValue?: any;
  options?: Option[];
  validation?: ValidationRule;
  layout?: Layout;
  fileRequirements?: FileRequirements;
}

export interface Section {
  _id?: string;
  sectionId: string;
  title: string;
  description?: string;
  fields: Field[];
}

export interface FormSchema {
  _id: string;
  title: string;
  description?: string;
  version: number;
  isActive: boolean;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}
