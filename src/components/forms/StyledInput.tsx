import { ComponentType } from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { FormField } from './FormField';

interface StyledInputProps {
  id: string;
  type?: string;
  placeholder: string;
  disabled?: boolean;
  register: UseFormRegisterReturn;
  error?: FieldError;
  icon?: ComponentType<{ width: string; height: string; color: string }>;
  label: string;
  required?: boolean;
}

export function StyledInput({
  id,
  type = 'text',
  placeholder,
  disabled,
  register,
  error,
  icon,
  label,
  required,
}: StyledInputProps) {
  return (
    <FormField id={id} label={label} error={error?.message} icon={icon} required={required}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-6)',
          fontSize: '14px',
        }}
        {...register}
      />
    </FormField>
  );
}
