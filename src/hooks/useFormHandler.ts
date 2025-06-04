import { useState } from 'react';
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/providers/ToastProvider';

interface UseFormHandlerProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<{ success?: boolean; error?: string }>;
  onSuccess?: () => void;
  defaultValues?: UseFormProps<T>['defaultValues'];
}

export function useFormHandler<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  defaultValues,
}: UseFormHandlerProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (data: T) => {
    setIsLoading(true);
    try {
      const result = await onSubmit(data);

      if (result.error) {
        toast(result.error, 'error', 'Operation Failed');
      } else {
        toast('Operation completed successfully!', 'success', 'Success');
        onSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast(message, 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  });

  return {
    ...form,
    handleSubmit,
    isLoading,
  };
}
