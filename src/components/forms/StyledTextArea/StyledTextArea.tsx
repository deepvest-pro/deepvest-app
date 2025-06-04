import { ChangeEvent, cloneElement, forwardRef, TextareaHTMLAttributes } from 'react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

/**
 * Props for StyledTextArea component
 */
export interface StyledTextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  /** Textarea label text */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error object from react-hook-form */
  error?: FieldError;
  /** Additional help text */
  helpText?: string;
  /** React Hook Form register return object */
  register?: UseFormRegisterReturn;
  /** Textarea variant style */
  variant?: 'default' | 'outline' | 'filled';
  /** Textarea size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show character count */
  showCharCount?: boolean;
  /** Maximum character limit */
  maxLength?: number;
  /** Whether textarea should auto-resize */
  autoResize?: boolean;
  /** Textarea ID for accessibility */
  id?: string;
}

/**
 * Styled textarea component with consistent design and form integration
 * Can be used standalone or within FormField component
 */
export const StyledTextArea = forwardRef<HTMLTextAreaElement, StyledTextAreaProps>(
  function StyledTextArea(
    {
      label,
      required = false,
      error,
      helpText,
      register,
      variant = 'default',
      size = 'md',
      showCharCount = false,
      maxLength,
      autoResize = false,
      className = '',
      value,
      onChange,
      id,
      ...textareaProps
    },
    ref,
  ) {
    // Merge register props with textarea props
    const mergedProps = register ? { ...register, ...textareaProps } : textareaProps;

    // Merge refs if register provides one
    const textareaRef = register?.ref || ref;

    // Handle character count
    const currentLength = typeof value === 'string' ? value.length : 0;
    const showCount = showCharCount && (maxLength || currentLength > 0);

    const textareaClasses = [
      'styled-textarea',
      `styled-textarea--${variant}`,
      `styled-textarea--${size}`,
      error && 'styled-textarea--error',
      autoResize && 'styled-textarea--auto-resize',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Auto-resize functionality
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }

      // Call original onChange if provided
      if (onChange) {
        onChange(e);
      } else if (register?.onChange) {
        register.onChange(e);
      }
    };

    const textareaElement = (
      <div className="styled-textarea__wrapper">
        <textarea
          ref={textareaRef}
          className={textareaClasses}
          aria-invalid={error ? 'true' : 'false'}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          id={id}
          {...mergedProps}
        />

        {showCount && (
          <div className="styled-textarea__char-count">
            <span
              className={
                currentLength > (maxLength || Infinity) ? 'styled-textarea__char-count--over' : ''
              }
            >
              {currentLength}
              {maxLength && `/${maxLength}`}
            </span>
          </div>
        )}
      </div>
    );

    // If label is provided, wrap in FormField-like structure
    if (label) {
      const fieldId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
      const errorId = `${fieldId}-error`;
      const helpId = `${fieldId}-help`;

      return (
        <div className="styled-textarea__field">
          <label
            htmlFor={fieldId}
            className={`styled-textarea__label ${required ? 'styled-textarea__label--required' : ''}`}
          >
            {label}
            {required && (
              <span className="styled-textarea__required" aria-label="required">
                *
              </span>
            )}
          </label>

          {cloneElement(textareaElement, {
            id: fieldId,
            'aria-describedby':
              [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ') ||
              undefined,
          })}

          {error && (
            <div id={errorId} className="styled-textarea__error" role="alert" aria-live="polite">
              {error.message}
            </div>
          )}

          {helpText && !error && (
            <div id={helpId} className="styled-textarea__help">
              {helpText}
            </div>
          )}
        </div>
      );
    }

    return textareaElement;
  },
);
