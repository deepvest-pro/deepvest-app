import { ComponentType, ReactNode } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';

/**
 * Props for FormField component
 */
interface FormFieldProps {
  /** Unique identifier for the form field */
  id: string;
  /** Field label text */
  label: string;
  /** Error message */
  error?: string;
  icon?: ComponentType<{ width: string; height: string; color: string }>;
  /** Child form input element */
  children: ReactNode;
  /** Whether the field is required */
  required?: boolean;
}

/**
 * Base form field wrapper component
 * Provides consistent styling and error handling for form inputs
 *
 * @example
 * ```tsx
 * <FormField id="email" label="Email Address" required error={errors.email}>
 *   <StyledInput
 *     type="email"
 *     placeholder="Enter your email"
 *     {...register('email')}
 *   />
 * </FormField>
 * ```
 */
export function FormField({ id, label, error, icon: Icon, children, required }: FormFieldProps) {
  return (
    <Box mb="3">
      <Flex gap="2" mb="1" align="center">
        {Icon && <Icon width="16" height="16" color="var(--gray-8)" />}
        <Text as="label" htmlFor={id} size="2" weight="medium">
          {label}
          {required && (
            <Text color="red" ml="1">
              *
            </Text>
          )}
        </Text>
      </Flex>
      {children}
      {error && (
        <Text size="1" color="red" mt="1">
          {error}
        </Text>
      )}
    </Box>
  );
}
