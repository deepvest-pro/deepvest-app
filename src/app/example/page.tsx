import React from 'react';
import { PageContainer, PageHeader } from '@/components/layout';
import { ExamplePageContent } from '@/components/ui';

export default function ExamplePage() {
  return (
    <PageContainer>
      <PageHeader title="Example Page" subtitle="Component reuse demonstration" />

      <ExamplePageContent
        explanationText="This is an example page that uses the same layout components as the main page. This way, we avoid code duplication."
        bottomText="The page is a server component by default, and interactive elements are imported from client components."
        buttonText="Learn More"
      />
    </PageContainer>
  );
}
