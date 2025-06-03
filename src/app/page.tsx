import React from 'react';
import { PageContainer, PageHeader } from '@/components/layout';
import { ComponentsDemo } from '@/components/ui';

export default function Home() {
  return (
    <PageContainer>
      <PageHeader title="DeepVest" subtitle="Modern investment platform" />
      <ComponentsDemo />
    </PageContainer>
  );
}
