'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Box, Flex, Text, Avatar, Badge } from '@radix-ui/themes';
import { GlobeIcon, ArrowTopRightIcon } from '@radix-ui/react-icons';
import type { ProjectWithSnapshot } from '@/types';
import { StatusBadge } from '@/components/ui';

interface ProjectCardProps {
  project: ProjectWithSnapshot & { role?: string | null };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const currentSnapshot = project.new_snapshot || project.public_snapshot;
  const projectName = currentSnapshot?.name || 'Unnamed Project';
  const projectDescription = currentSnapshot?.description || 'No description provided.';
  const projectStatus = currentSnapshot?.status || 'Unknown';
  const logoUrl = currentSnapshot?.logo_url;
  const projectCountry = currentSnapshot?.country;
  const projectCity = currentSnapshot?.city;

  const isUserProject = project.role !== null && project.role !== undefined;
  const isPublic = project.is_public;

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card
        variant="surface"
        style={{
          background: 'var(--gradient-card)',
          border: '1px solid rgba(0, 168, 107, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
        className="project-card hover:shadow-xl hover:scale-[1.02] hover:border-[var(--flow-green)]"
      >
        {/* Hover overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(135deg, rgba(0, 168, 107, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          className="group-hover:opacity-100"
        />

        <Box p="6" style={{ position: 'relative', zIndex: 2 }}>
          <Flex gap="4" align="start">
            {/* Project Logo */}
            <Box style={{ flexShrink: 0 }}>
              <Avatar
                size="6"
                src={logoUrl || undefined}
                alt={`${projectName} logo`}
                radius="medium"
                fallback={projectName[0] || '?'}
                style={{
                  width: '72px',
                  height: '72px',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
            </Box>

            {/* Project Content */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Flex justify="between" align="start" mb="3">
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap="2" mb="2">
                    <Text
                      size="5"
                      weight="bold"
                      style={{
                        color: 'var(--text-primary)',
                        lineHeight: '1.3',
                      }}
                    >
                      {projectName}
                    </Text>
                    <ArrowTopRightIcon
                      width="16"
                      height="16"
                      style={{
                        color: 'var(--flow-green)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      }}
                      className="group-hover:opacity-100"
                    />
                  </Flex>

                  <Flex align="center" gap="2" mb="3" wrap="wrap">
                    <StatusBadge
                      status={projectStatus}
                      type="project"
                      size="2"
                      variant="soft"
                      showIcon={true}
                    />

                    {projectCountry && projectCity && (
                      <Badge
                        variant="soft"
                        size="2"
                        radius="full"
                        style={{
                          background: 'rgba(0, 168, 107, 0.1)',
                          color: 'var(--flow-green-dark)',
                        }}
                      >
                        <Flex gap="1" align="center">
                          <GlobeIcon width="12" height="12" />
                          <Text size="1" weight="medium">
                            {projectCity}, {projectCountry}
                          </Text>
                        </Flex>
                      </Badge>
                    )}

                    {isUserProject && (
                      <Badge
                        size="2"
                        style={{
                          background: 'var(--gradient-accent)',
                          color: 'white',
                          fontWeight: '500',
                        }}
                      >
                        Your Project
                      </Badge>
                    )}

                    {isUserProject && !isPublic && (
                      <Badge
                        variant="soft"
                        size="2"
                        style={{
                          backgroundColor: 'var(--orange-3)',
                          color: 'var(--orange-11)',
                        }}
                      >
                        Private
                      </Badge>
                    )}
                  </Flex>
                </Box>
              </Flex>

              <Text
                size="3"
                mb="4"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                {projectDescription}
              </Text>

              <Flex justify="between" align="center">
                <Text size="2" style={{ color: 'var(--text-muted)' }}>
                  Status: {projectStatus}
                </Text>
                <Text size="2" style={{ color: 'var(--text-muted)' }}>
                  Updated:{' '}
                  {project.updated_at
                    ? new Date(project.updated_at).toLocaleDateString('en-GB')
                    : 'Unknown date'}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Card>
    </Link>
  );
}
