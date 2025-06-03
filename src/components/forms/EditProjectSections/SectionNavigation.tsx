'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Text, Box, Badge } from '@radix-ui/themes';
import {
  InfoCircledIcon,
  FileTextIcon,
  DashboardIcon,
  TargetIcon,
  PersonIcon,
} from '@radix-ui/react-icons';

export type ProjectSection = 'common' | 'documents' | 'funding' | 'milestones' | 'team';

interface SectionNavigationProps {
  currentSection: ProjectSection;
  projectId: string;
  completedSections?: Set<ProjectSection>;
  hasUnsavedChanges?: boolean;
  isVertical?: boolean;
}

const sections = [
  {
    id: 'common' as ProjectSection,
    title: 'Common Info',
    icon: InfoCircledIcon,
    description: 'Basic project information',
  },
  {
    id: 'documents' as ProjectSection,
    title: 'Documents',
    icon: FileTextIcon,
    description: 'Project documents and files',
  },
  {
    id: 'funding' as ProjectSection,
    title: 'Funding',
    icon: DashboardIcon,
    description: 'Funding details and goals',
  },
  {
    id: 'milestones' as ProjectSection,
    title: 'Milestones',
    icon: TargetIcon,
    description: 'Project milestones and timeline',
  },
  {
    id: 'team' as ProjectSection,
    title: 'Team',
    icon: PersonIcon,
    description: 'Team members and collaboration',
  },
];

export function SectionNavigation({
  currentSection,
  projectId,
  completedSections = new Set(),
  hasUnsavedChanges = false,
  isVertical = false,
}: SectionNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSectionChange = (sectionId: ProjectSection) => {
    if (sectionId === currentSection) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('section', sectionId);

    router.push(`/projects/${projectId}/edit?${params.toString()}`);
  };

  return (
    <Box mb={isVertical ? '0' : '6'}>
      <Flex direction="column" gap="3">
        {!isVertical && (
          <Text size="3" weight="medium" color="gray">
            Edit Project Sections
          </Text>
        )}

        <Flex
          direction={isVertical ? 'column' : 'row'}
          gap="2"
          wrap={isVertical ? 'nowrap' : 'wrap'}
        >
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = section.id === currentSection;
            const isCompleted = completedSections.has(section.id);

            return (
              <Box
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                style={{
                  cursor: 'pointer',
                  padding: isVertical ? '10px 12px' : '12px 16px',
                  borderRadius: 'var(--radius-3)',
                  border: `1px solid ${isActive ? 'var(--blue-7)' : 'var(--gray-6)'}`,
                  backgroundColor: isActive ? 'var(--blue-2)' : 'var(--gray-1)',
                  transition: 'all 0.2s ease',
                  minWidth: isVertical ? 'auto' : '140px',
                  width: isVertical ? '100%' : 'auto',
                }}
                className={`section-nav-item ${isActive ? 'active' : ''}`}
              >
                <Flex
                  direction={isVertical ? 'row' : 'column'}
                  gap="2"
                  align={isVertical ? 'center' : 'center'}
                  justify={isVertical ? 'start' : 'center'}
                >
                  <Flex align="center" gap="2" style={{ width: isVertical ? '100%' : 'auto' }}>
                    <Icon
                      width="16"
                      height="16"
                      color={isActive ? 'var(--blue-9)' : 'var(--gray-8)'}
                    />
                    <Text
                      size="2"
                      weight={isActive ? 'bold' : 'medium'}
                      color={isActive ? 'blue' : 'gray'}
                    >
                      {section.title}
                    </Text>
                    {isCompleted && (
                      <Badge size="1" color="green" style={{ marginLeft: 'auto' }}>
                        ✓
                      </Badge>
                    )}
                  </Flex>

                  {!isVertical && (
                    <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                      {section.description}
                    </Text>
                  )}
                </Flex>
              </Box>
            );
          })}
        </Flex>

        {hasUnsavedChanges && (
          <Flex align="center" gap="2" mt="2">
            <Box
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--amber-9)',
              }}
            />
            <Text size="2" color="amber">
              You have unsaved changes in this section
            </Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
