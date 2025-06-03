'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Card,
  Button,
  Tabs,
  Grid,
  Avatar,
  Separator,
} from '@radix-ui/themes';

export function ComponentsDemo() {
  return (
    <Tabs.Root defaultValue="components">
      <Tabs.List>
        <Tabs.Trigger value="components">UI Components</Tabs.Trigger>
        <Tabs.Trigger value="cards">Cards</Tabs.Trigger>
        <Tabs.Trigger value="buttons">Buttons</Tabs.Trigger>
      </Tabs.List>

      <Box pt="5">
        <Tabs.Content value="components">
          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="4">Avatar Component</Heading>
                <Flex gap="3">
                  <Avatar
                    src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453"
                    fallback="A"
                    radius="full"
                  />
                  <Avatar fallback="BP" radius="full" color="blue" />
                  <Avatar fallback="CK" radius="full" color="green" />
                </Flex>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="4">Text Styles</Heading>
                <Text size="5" weight="bold">
                  Heading Text
                </Text>
                <Text size="3">Regular paragraph text</Text>
                <Text size="2" color="gray">
                  Secondary small text
                </Text>
              </Flex>
            </Card>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="cards">
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            <Card>
              <Flex direction="column" gap="2">
                <Heading size="3">Investment Project</Heading>
                <Text size="2">A new fintech solution</Text>
                <Separator my="2" size="4" />
                <Button color="blue" variant="soft">
                  View Details
                </Button>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="2">
                <Heading size="3">Real Estate Fund</Heading>
                <Text size="2">Commercial property investment</Text>
                <Separator my="2" size="4" />
                <Button color="green" variant="soft">
                  View Details
                </Button>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="2">
                <Heading size="3">Startup Accelerator</Heading>
                <Text size="2">Early stage venture capital</Text>
                <Separator my="2" size="4" />
                <Button color="orange" variant="soft">
                  View Details
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="buttons">
          <Flex direction="column" gap="4">
            <Heading size="4">Button Variants</Heading>
            <Flex wrap="wrap" gap="3">
              <Button>Default</Button>
              <Button variant="solid" color="blue">
                Solid
              </Button>
              <Button variant="soft" color="green">
                Soft
              </Button>
              <Button variant="outline" color="orange">
                Outline
              </Button>
              <Button variant="ghost" color="red">
                Ghost
              </Button>
            </Flex>

            <Heading size="4">Button Sizes</Heading>
            <Flex align="center" gap="3">
              <Button size="1">Small</Button>
              <Button size="2">Medium</Button>
              <Button size="3">Large</Button>
            </Flex>
          </Flex>
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
}
