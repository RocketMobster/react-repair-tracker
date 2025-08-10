// Field schema and config for all supported types
export const FIELD_TYPES = [
  {
    type: 'text',
    label: 'Text',
    config: {
      required: false,
      placeholder: '',
      minLength: 0,
      maxLength: 255,
      pattern: '',
      errorMessage: 'Please enter valid text.',
    },
  },
  {
  type: 'textarea',
  label: 'Textarea',
  config: {
    required: false,
    placeholder: '',
    minLength: 0,
    maxLength: 1000,
    errorMessage: 'Please enter a valid description (max 1000 characters).',
  },
 },
  {
    type: 'number',
    label: 'Number',
    config: {
      required: false,
      placeholder: '',
      min: null,
      max: null,
      step: 1,
      errorMessage: 'Please enter a valid number.',
    },
  },
  {
    type: 'date',
    label: 'Date',
    config: {
      required: false,
      min: '',
      max: '',
      errorMessage: 'Please select a valid date.',
    },
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    config: {
      required: false,
      options: '', // comma separated
      placeholder: '',
      errorMessage: 'Please select an option.',
    },
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    config: {
      required: false,
      checked: false,
      errorMessage: 'Please check this box if required.',
    },
  },
  {
    type: 'radio',
    label: 'Radio',
    config: {
      required: false,
      options: '', // comma separated
      errorMessage: 'Please select one of the options.',
    },
  },
];
