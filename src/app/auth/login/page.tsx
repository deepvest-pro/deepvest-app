import { Card, Heading, Text, Flex } from '@radix-ui/themes';
import { CivicLoginButton } from '@/components/auth/CivicLoginButton';

export default function LoginPage() {
  return (
    <Flex direction="column" gap="4" align="center" justify="center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Card style={{ maxWidth: '400px', width: '100%' }} size="3">
        <Flex direction="column" gap="4" align="center">
          <Heading as="h1" size="6">Welcome to DeepVest</Heading>
          <Text as="p" size="2" color="gray">
            Log in using your Civic account to access the platform.
          </Text>
          
          <CivicLoginButton 
            redirectTo="/dashboard" 
            label="Continue with Civic" 
            className="w-full"
          />
          
          <Text as="p" size="1" color="gray" style={{ textAlign: 'center' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
