'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Flex, Text, Box, Card, Heading } from '@radix-ui/themes';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@radix-ui/react-icons';
import { useToastHelpers } from '../layout/ToastProvider';

// Generic type for form data
type FormData = Record<string, unknown>;

interface StepComponentProps<T extends FormData = FormData> {
  onSubmit: (data: T) => void;
  initialData: T;
  isSubmitting?: boolean;
}

interface Step<T extends FormData = FormData> {
  id: string;
  title: string;
  component: React.ReactElement<StepComponentProps<T>>;
  isOptional?: boolean;
}

interface MultiStepFormProps<T extends FormData = FormData> {
  steps: Step<T>[];
  onComplete: (allData: T) => Promise<void>;
  initialData?: T;
  isSubmitting?: boolean;
  showSummary?: boolean;
  submitButtonText?: string;
  submittingText?: string;
  successMessage?: string;
}

export function MultiStepForm<T extends FormData = FormData>({
  steps,
  onComplete,
  initialData = {} as T,
  isSubmitting = false,
  showSummary = true,
  submitButtonText = 'Create Project',
  submittingText = 'Creating Project...',
  successMessage = 'Project successfully created!',
}: MultiStepFormProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<T>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const { success, error } = useToastHelpers();

  // Use ref to track previous initialData for comparison
  const prevInitialDataRef = useRef<T>(initialData);

  // Reset form when initialData changes (with deep comparison)
  useEffect(() => {
    // Only update if initialData has actually changed (avoid infinite loop)
    const initialDataStr = JSON.stringify(initialData);
    const prevInitialDataStr = JSON.stringify(prevInitialDataRef.current);

    if (initialDataStr !== prevInitialDataStr) {
      prevInitialDataRef.current = initialData;
      setFormData(initialData);
    }
  }, [initialData]);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleStepSubmit = (stepId: string, stepData: Partial<T>) => {
    const updatedData = { ...formData, ...stepData } as T;
    setFormData(updatedData);
    setCompletedSteps({ ...completedSteps, [stepId]: true });

    if (!isLastStep) {
      goToNextStep();
      success('Step saved successfully!');
    } else if (showSummary) {
      // If this is the last step and we want to show a summary
      handleComplete(updatedData);
    }
  };

  const handleComplete = async (data: T) => {
    try {
      await onComplete(data);
      success(successMessage);
    } catch (err) {
      console.error('Error completing form:', err);
      error('Failed to save changes. Please try again.');
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToStep = (index: number) => {
    const targetStepId = steps[index].id;
    const canNavigate = index <= currentStepIndex || completedSteps[targetStepId];

    if (canNavigate) {
      setCurrentStepIndex(index);
    } else {
      error('Please complete the current step first');
    }
  };

  return (
    <Box className="multi-step-form">
      <Flex gap="2" mb="4" justify="between" wrap="wrap">
        {steps.map((step, index) => (
          <Flex
            key={step.id}
            direction="column"
            align="center"
            className={`step-indicator ${index === currentStepIndex ? 'active' : ''} ${
              completedSteps[step.id] ? 'completed' : ''
            }`}
            style={{
              cursor:
                completedSteps[step.id] || index <= currentStepIndex ? 'pointer' : 'not-allowed',
            }}
            onClick={() => goToStep(index)}
          >
            <Box
              className="step-number"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: completedSteps[step.id]
                  ? 'var(--green-9)'
                  : index === currentStepIndex
                    ? 'var(--blue-9)'
                    : 'var(--gray-5)',
                color: 'white',
                marginBottom: '8px',
              }}
            >
              {completedSteps[step.id] ? <CheckIcon /> : index + 1}
            </Box>
            <Text
              size="2"
              weight={index === currentStepIndex ? 'bold' : 'regular'}
              color={
                index === currentStepIndex ? 'blue' : completedSteps[step.id] ? 'green' : 'gray'
              }
            >
              {step.title}
              {step.isOptional && (
                <Text as="span" size="1" color="gray">
                  {' '}
                  (Optional)
                </Text>
              )}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Card className="step-content">
        <Box p="4">
          <Heading as="h2" size="5" mb="4">
            {currentStep.title}
          </Heading>

          {React.cloneElement(currentStep.component, {
            onSubmit: (data: Partial<T>) => handleStepSubmit(currentStep.id, data),
            initialData: formData,
            isSubmitting,
            key: currentStep.id,
          })}
        </Box>
      </Card>

      <Flex justify="between" mt="4">
        <Button variant="soft" onClick={goToPreviousStep} disabled={isFirstStep || isSubmitting}>
          <ChevronLeftIcon /> Back
        </Button>

        {!isLastStep && !showSummary && (
          <Button
            onClick={() => {
              const form = document.querySelector('.step-content form') as HTMLFormElement;
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            disabled={isSubmitting}
          >
            Next <ChevronRightIcon />
          </Button>
        )}

        {(isLastStep || !showSummary) && (
          <Button
            onClick={() => {
              const form = document.querySelector('.step-content form') as HTMLFormElement;
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? submittingText : submitButtonText}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
