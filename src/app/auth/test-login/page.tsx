'use client';

import React, { useState, ChangeEvent } from 'react';
import { Card, Heading, Text, Flex, Button, TextField as RadixTextField, Code } from '@radix-ui/themes';
import { testCivicSupabaseLogin } from '@/lib/auth/test-civic-login';

export default function TestCivicLogin() {
  const [email, setEmail] = useState('');
  const [idToken, setIdToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestLogin = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Use the test utility to test the Civic-Supabase login
      const testResult = await testCivicSupabaseLogin(email, idToken || undefined);
      
      if (!testResult.success) {
        setError(testResult.error || 'Unknown error');
      } else {
        setResult(testResult.data);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="6" align="center" justify="center" style={{ padding: '2rem' }}>
      <Heading size="6">Test Civic-Supabase Integration</Heading>
      
      <Card size="3" style={{ width: '100%', maxWidth: '800px' }}>
        <Flex direction="column" gap="4">
          <Heading as="h2" size="4">Test Login</Heading>
          <Text as="p" size="3">
            This page allows you to test the Civic-Supabase integration without using the actual Civic UI.
            Enter an email address to test the login flow.
          </Text>
          
          <Flex direction="column" gap="3">
            
            <Button 
              onClick={handleTestLogin} 
              disabled={isLoading || !email}
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </Button>
          </Flex>
          
          {error && (
            <Text as="p" color="red" size="2">
              Error: {error}
            </Text>
          )}
        </Flex>
      </Card>
      
      {result && (
        <Card size="3" style={{ width: '100%', maxWidth: '800px' }}>
          <Flex direction="column" gap="4">
            <Heading as="h2" size="4">Login Result</Heading>
            <div>
              <Heading as="h3" size="3">Authentication Status:</Heading>
              <Text as="p" size="2" style={{ color: 'green' }}>✅ Authentication successful!</Text>
              
              <Heading as="h3" size="3" mt="4">Generated Password:</Heading>
              <Text as="p" size="2">
                {result.passwordUsed || 'No password returned'}
              </Text>
              
              <Heading as="h3" size="3" mt="4">User Data:</Heading>
              <Code size="1" style={{ display: 'block', padding: '1rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result.user, null, 2)}
              </Code>
              
              <Heading as="h3" size="3" mt="4">Session Info:</Heading>
              <Code size="1" style={{ display: 'block', padding: '1rem', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(result.session, null, 2)}
              </Code>
            </div>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
