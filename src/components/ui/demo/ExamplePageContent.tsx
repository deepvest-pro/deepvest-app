'use client';

import React from 'react';
import { Card, Text, Box, Grid, Button } from '@radix-ui/themes';

interface ExamplePageContentProps {
  explanationText: string;
  bottomText: string;
  buttonText: string;
}

export function ExamplePageContent({
  explanationText,
  bottomText,
  buttonText,
}: ExamplePageContentProps) {
  return (
    <Grid columns={{ initial: '1', md: '2' }} gap="4">
      <Card>
        <Box p="3">
          <Text as="p" size="3">
            {explanationText}
          </Text>
        </Box>
      </Card>

      <Card>
        <Box p="3">
          <Text as="p" size="3" mb="3">
            {bottomText}
          </Text>
          <Button variant="solid" color="blue">
            {buttonText}
          </Button>
        </Box>
      </Card>
    </Grid>
  );
}
