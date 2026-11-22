'use client';
import { latestRegistrationDob } from '@/lib/domain/registration-age.mjs';
import PasswordInput from '@/components/forms/PasswordInput';
import { useGym } from '@/features/app/GymProvider';
import { scheduleMinimum } from '@/lib/domain/form-validation.mjs';
import { ageFromDob, klNow } from '@/lib/validation.mjs';
import { useId } from 'react';
import type { FieldDefinition } from './field-definitions';
/** FORM FIELD UI: typed definitions render labels, constraints, help text and accessible errors. */
export default function FormFields({
  fields,
  form,
}: {
  fields: FieldDefinition[];
  form: string;
}) {
  const { values, setValues, errors, data, user } = useGym();
  const prefix = useId();
  function change(key: string, value: string) {
    setValues((old: Record<string, unknown>) => ({
      ...old,
      [key]: value,
      ...(key === 'date_of_birth' ? { age: ageFromDob(value) } : {}),
    }));
  }
  return (
    <div
      className={
        ['register', 'login', 'staff-create'].includes(form)
          ? 'form-grid form-grid--vertical'
          : 'form-grid'
      }
    >
      {fields.map((field) => {
        const { key, label, type } = field;
        const Input = type === 'password' ? PasswordInput : 'input';
        const id = prefix + '-' + key;
        const optional =
          field.optional ||
          (form === 'profile' &&
            (['height', 'weight'].includes(key) ||
              (user?.role !== 'member' && ['date_of_birth', 'age'].includes(key))));
        const describedBy =
          [field.hint ? id + '-help' : '', errors[key] ? id + '-error' : '']
            .filter(Boolean)
            .join(' ') || undefined;
        const accessibility = {
          id,
          'aria-invalid': Boolean(errors[key]),
          'aria-describedby': describedBy,
        };
        return (
          <label key={key} htmlFor={id} className={type === 'textarea' ? 'wide' : ''}>
            <span>
              {label}
              {['register', 'staff-create'].includes(form) &&
                type !== 'readonly' &&
                !optional && (
                  <span className="required-mark" aria-hidden="true">
                    {' '}
                    *
                  </span>
                )}
            </span>
            {type === 'readonly' ? (
              <>
                <input
                  {...accessibility}
                  readOnly
                  value={ageFromDob(values.date_of_birth) ?? ''}
                  placeholder="Calculated from date of birth"
                />
                <small>Calculated automatically from your date of birth.</small>
              </>
            ) : type === 'class-type' ? (
              <select
                {...accessibility}
                required
                value={values.class_id || ''}
                onChange={(e) => {
                  const selected = data.class_types.find((c) => c.id === e.target.value);
                  setValues({
                    ...values,
                    class_id: e.target.value,
                    ...(selected
                      ? {
                          name: selected.name,
                          fee: selected.fee,
                          capacity: selected.default_capacity,
                        }
                      : {}),
                  });
                }}
              >
                <option value="">Select a class type</option>
                {data.class_types
                  .filter((c) => !c.archived)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            ) : type === 'trainer' ? (
              <select
                {...accessibility}
                required
                value={values.trainer_id || ''}
                onChange={(e) => {
                  const trainer = data.profiles.find((x) => x.id === e.target.value);
                  setValues({
                    ...values,
                    trainer_id: e.target.value,
                    ...(trainer ? { trainer: trainer.name } : {}),
                  });
                }}
              >
                <option value="">Select a trainer</option>
                {data.trainers.map((trainer) => (
                  <option key={trainer.trainer_id} value={trainer.trainer_id}>
                    {trainer.trainer_name}
                  </option>
                ))}
              </select>
            ) : type === 'select' ? (
              <select
                {...accessibility}
                required={!optional}
                value={values[key] || ''}
                onChange={(e) => change(key, e.target.value)}
              >
                <option value="">Select {label.toLowerCase()}</option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                {...accessibility}
                required={!optional}
                value={values[key] || ''}
                onChange={(e) => change(key, e.target.value)}
              />
            ) : (
              <Input
                {...accessibility}
                required={!optional}
                type={type}
                autoComplete={
                  key === 'password'
                    ? form === 'login'
                      ? 'current-password'
                      : 'new-password'
                    : key === 'username'
                      ? 'username'
                      : undefined
                }
                value={values[key] ?? ''}
                min={
                  type === 'datetime-local' && form === 'class'
                    ? scheduleMinimum(key, values.starts_at)
                    : field.min
                }
                max={
                  type === 'date'
                    ? ['register'].includes(form) && key === 'date_of_birth'
                      ? [latestRegistrationDob(), '2008-12-31'].sort()[0]
                      : klNow().slice(0, 10)
                    : field.max
                }
                step={field.step}
                minLength={field.minLength}
                maxLength={field.maxLength}
                pattern={field.pattern}
                onChange={(e) => change(key, e.target.value)}
              />
            )}
            {field.hint && <small id={id + '-help'}>{field.hint}</small>}
            {errors[key] && (
              <span id={id + '-error'} className="field-error">
                {errors[key]}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
