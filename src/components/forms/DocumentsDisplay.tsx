'use client';

import React from 'react';
import { Flex, Text, Card, Badge, Button } from '@radix-ui/themes';
import {
  FileTextIcon,
  DownloadIcon,
  DotsHorizontalIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from '@radix-ui/react-icons';
import { DropdownMenu } from '@radix-ui/themes';
import { ProjectContentWithAuthor, ContentType } from '@/types/supabase';

interface DocumentsDisplayProps {
  documents: ProjectContentWithAuthor[];
  showActions?: boolean;
  onEdit?: (document: ProjectContentWithAuthor) => void;
  onDelete?: (documentId: string) => void;
  onToggleVisibility?: (documentId: string, isPublic: boolean) => void;
  canEdit?: boolean;
  emptyMessage?: string;
}

export function DocumentsDisplay({
  documents,
  showActions = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  canEdit = false,
  emptyMessage = 'No documents available',
}: DocumentsDisplayProps) {
  const getContentTypeLabel = (contentType: ContentType): string => {
    const labels: Record<ContentType, string> = {
      presentation: 'Presentation',
      research: 'Research',
      pitch_deck: 'Pitch Deck',
      whitepaper: 'Whitepaper',
      video: 'Video',
      audio: 'Audio',
      image: 'Image',
      report: 'Report',
      document: 'Document',
      spreadsheet: 'Spreadsheet',
      table: 'Table',
      chart: 'Chart',
      infographic: 'Infographic',
      case_study: 'Case Study',
      other: 'Other',
    };
    return labels[contentType] || 'Document';
  };

  const getContentTypeColor = (contentType: ContentType) => {
    const colors: Record<ContentType, string> = {
      presentation: 'blue',
      research: 'green',
      pitch_deck: 'purple',
      whitepaper: 'indigo',
      video: 'red',
      audio: 'orange',
      image: 'pink',
      report: 'cyan',
      document: 'gray',
      spreadsheet: 'yellow',
      table: 'amber',
      chart: 'violet',
      infographic: 'plum',
      case_study: 'teal',
      other: 'gray',
    };
    return colors[contentType] || 'gray';
  };

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (documents.length === 0) {
    return (
      <Card variant="surface" size="3">
        <Flex direction="column" align="center" justify="center" gap="3" py="6">
          <FileTextIcon width="32" height="32" color="var(--gray-9)" />
          <Text size="3" color="gray" align="center">
            {emptyMessage}
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {documents.map(document => (
        <Card key={document.id} variant="surface" size="2">
          <Flex align="center" justify="between" p="3">
            <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
              <FileTextIcon width="20" height="20" color="var(--blue-9)" />

              <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap="2" wrap="wrap">
                  <Text size="3" weight="medium" style={{ wordBreak: 'break-word' }}>
                    {document.title}
                  </Text>
                  <Badge
                    color={
                      getContentTypeColor(document.content_type) as
                        | 'blue'
                        | 'green'
                        | 'purple'
                        | 'indigo'
                        | 'red'
                        | 'orange'
                        | 'pink'
                        | 'cyan'
                        | 'gray'
                        | 'yellow'
                        | 'amber'
                        | 'violet'
                        | 'plum'
                        | 'teal'
                    }
                    variant="soft"
                    size="1"
                  >
                    {getContentTypeLabel(document.content_type)}
                  </Badge>
                  <Flex align="center" gap="1">
                    {document.is_public ? (
                      <EyeOpenIcon width="12" height="12" color="var(--green-9)" />
                    ) : (
                      <EyeClosedIcon width="12" height="12" color="var(--gray-9)" />
                    )}
                    <Text size="1" color="gray">
                      {document.is_public ? 'Public' : 'Private'}
                    </Text>
                  </Flex>
                </Flex>

                {document.description && (
                  <Text size="2" color="gray" style={{ wordBreak: 'break-word' }}>
                    {document.description}
                  </Text>
                )}

                <Text size="1" color="gray">
                  {document.author?.full_name && `by ${document.author.full_name}`}
                </Text>
              </Flex>
            </Flex>

            <Flex align="center" gap="2">
              {/* Download button for first file */}
              {document.file_urls.length > 0 && (
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => handleDownload(document.file_urls[0], document.title)}
                >
                  <DownloadIcon width="14" height="14" />
                </Button>
              )}

              {/* Actions menu - only show if showActions is true */}
              {showActions && canEdit && onEdit && onDelete && onToggleVisibility && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button size="1" variant="ghost">
                      <DotsHorizontalIcon width="14" height="14" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={() => onEdit(document)}>Edit</DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => onToggleVisibility(document.id, !document.is_public)}
                    >
                      Make {document.is_public ? 'Private' : 'Public'}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item color="red" onClick={() => onDelete(document.id)}>
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              )}
            </Flex>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
