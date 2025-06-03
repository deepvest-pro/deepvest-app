'use client';

import { Button, Flex, Box, Heading } from '@radix-ui/themes';
import { useToast } from '@/components/layout/ToastProvider';

export function ToastTester() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast('This is a success message', 'success', 'Success!');
  };

  const showErrorToast = () => {
    toast('This is an error message', 'error', 'Error!');
  };

  const showWarningToast = () => {
    toast('This is a warning message', 'warning', 'Warning!');
  };

  const showInfoToast = () => {
    toast('This is an info message', 'info', 'Info!');
  };

  return (
    <Box
      style={{
        padding: '20px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginTop: '20px',
      }}
    >
      <Heading size="3" mb="3">
        Test Toast Notifications
      </Heading>
      <Flex gap="3" direction="row">
        <Button onClick={showSuccessToast} color="green">
          Success Toast
        </Button>
        <Button onClick={showErrorToast} color="red">
          Error Toast
        </Button>
        <Button onClick={showWarningToast} color="orange">
          Warning Toast
        </Button>
        <Button onClick={showInfoToast} color="blue">
          Info Toast
        </Button>
      </Flex>
    </Box>
  );
}
