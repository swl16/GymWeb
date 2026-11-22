import { ROOM_NUMBERS } from '@/lib/domain/schedule-room.mjs';
/** FORM DEFINITIONS: typed labels, semantic input kinds and validation limits by screen. */
export type InputKind =
  | 'text'
  | 'password'
  | 'email'
  | 'tel'
  | 'date'
  | 'datetime-local'
  | 'number'
  | 'select'
  | 'textarea'
  | 'readonly'
  | 'trainer'
  | 'class-type';
export interface FieldDefinition {
  key: string;
  label: string;
  type: InputKind;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  hint?: string;
  optional?: boolean;
}
export type FormType =
  | 'plan'
  | 'class'
  | 'fitness'
  | 'measurements'
  | 'weekly-target'
  | 'profile'
  | 'register'
  | 'login'
  | 'trainer'
  | 'class-type';
export const formDefs: Record<FormType, FieldDefinition[]> = {
  plan: [
    {
      key: 'name',
      label: 'Plan name',
      type: 'text',
    },
    {
      key: 'duration_months',
      label: 'Duration (months)',
      type: 'number',
      min: 1,
      step: 1,
    },
    {
      key: 'price',
      label: 'Price (RM)',
      type: 'number',
      min: 0.01,
      step: 0.01,
    },
    {
      key: 'benefits',
      label: 'Benefits',
      type: 'textarea',
      hint: 'Enter one benefit per line. Example: Free locker, then Unlimited gym access on the next line.',
    },
    {
      key: 'class_discount_percent',
      label: 'Class discount (%)',
      type: 'number',
      min: 0,
      max: 100,
      step: 0.01,
    },
  ],
  'class-type': [
    { key: 'name', label: 'Class name', type: 'text', maxLength: 100 },
    { key: 'fee', label: 'Default fee (RM)', type: 'number', min: 0, step: 0.01 },
    {
      key: 'description',
      label: 'Description (optional)',
      type: 'textarea',
      optional: true,
    },
    {
      key: 'default_capacity',
      label: 'Default capacity',
      type: 'number',
      min: 1,
      step: 1,
    },
  ],
  class: [
    { key: 'class_id', label: 'Class type', type: 'class-type' },
    {
      key: 'starts_at',
      label: 'Starts at (Malaysia time)',
      hint: 'Choose a future date and time. Past dates are unavailable.',
      type: 'datetime-local',
    },
    {
      key: 'ends_at',
      label: 'Ends at (Malaysia time)',
      hint: 'Must be later than the session start.',
      type: 'datetime-local',
    },
    {
      key: 'trainer_id',
      label: 'Trainer account',
      type: 'trainer',
    },
    {
      key: 'room',
      label: 'Room',
      type: 'select',
      options: ROOM_NUMBERS,
      hint: 'Select a room from 1 to 10.',
    },
    {
      key: 'fee',
      label: 'Class fee (RM)',
      type: 'number',
      min: 0,
      step: 0.01,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      type: 'number',
      min: 1,
      step: 1,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Cancelled'],
    },
  ],
  fitness: [
    {
      key: 'goal',
      label: 'Fitness goal',
      type: 'text',
    },
    {
      key: 'duration',
      label: 'Workout duration (minutes)',
      type: 'number',
      min: 0,
      max: 1440,
      step: 1,
    },
  ],
  measurements: [
    {
      key: 'weight',
      label: 'Weight (kg)',
      type: 'number',
      min: 30.01,
      max: 299.99,
      step: 0.01,
      hint: 'More than 30 kg and less than 300 kg.',
    },
    {
      key: 'height',
      label: 'Height (meters)',
      type: 'number',
      min: 1.31,
      max: 2.49,
      step: 0.01,
      hint: 'More than 1.30 m and less than 2.50 m.',
    },
  ],
  'weekly-target': [
    {
      key: 'weekly_target_minutes',
      label: 'Weekly target (minutes)',
      type: 'number',
      min: 1,
      max: 10080,
      step: 1,
    },
  ],
  profile: [
    {
      key: 'name',
      label: 'Full name',
      type: 'text',
    },
    {
      key: 'date_of_birth',
      label: 'Date of birth',
      type: 'date',
    },
    {
      key: 'age',
      label: 'Age (automatic)',
      type: 'readonly',
    },
    {
      key: 'phone',
      label: 'Phone number',
      type: 'tel',
      maxLength: 11,
      pattern: '[0-9]{10,11}',
    },
    {
      key: 'email',
      label: 'Contact email',
      type: 'email',
    },
    {
      key: 'height',
      label: 'Height (meters)',
      type: 'number',
      min: 1.31,
      max: 2.49,
      step: 0.01,
      hint: 'More than 1.30 m and less than 2.50 m.',
    },
    {
      key: 'weight',
      label: 'Weight (kg)',
      type: 'number',
      min: 30.01,
      max: 299.99,
      step: 0.01,
      hint: 'More than 30 kg and less than 300 kg.',
    },
  ],
  register: [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      minLength: 3,
      maxLength: 11,
      pattern: '[A-Za-z0-9]{3,11}',
      hint: '3–11 letters or numbers only.',
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      minLength: 6,
      hint: 'At least 6 characters, including an uppercase letter, a digit and a special character.',
    },
    {
      key: 'name',
      label: 'Full name',
      type: 'text',
    },
    {
      key: 'date_of_birth',
      label: 'Date of birth',
      type: 'date',
      hint: 'You must be at least 18 years old to register.',
    },
    {
      key: 'age',
      label: 'Age (automatic)',
      type: 'readonly',
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['M', 'F'],
    },
    {
      key: 'phone',
      label: 'Phone number',
      type: 'tel',
      maxLength: 11,
      pattern: '[0-9]{10,11}',
    },
    {
      key: 'email',
      label: 'Email address',
      type: 'email',
    },
  ],
  trainer: [
    {
      key: 'password',
      label: 'Initial password',
      type: 'password',
      minLength: 6,
      hint: 'At least 6 characters, with an uppercase letter, a digit and a special character.',
    },
    {
      key: 'username',
      label: 'Trainer username',
      type: 'text',
      minLength: 3,
      maxLength: 11,
      pattern: '[A-Za-z0-9]{3,11}',
      hint: '3–11 letters or numbers only.',
    },
    {
      key: 'name',
      label: 'Trainer name',
      type: 'text',
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['M', 'F'],
    },
    {
      key: 'phone',
      label: 'Phone number',
      type: 'tel',
      maxLength: 11,
      pattern: '[0-9]{10,11}',
    },
    {
      key: 'email',
      label: 'Email address',
      type: 'email',
    },
  ],
  login: [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      minLength: 3,
      maxLength: 11,
      pattern: '[A-Za-z0-9]{3,11}',
      hint: '3–11 letters or numbers only.',
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      minLength: 6,
    },
  ],
};
