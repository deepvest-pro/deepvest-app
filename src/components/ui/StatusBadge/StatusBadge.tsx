/**
 * Reusable status badge component
 */

import { Badge, Flex, Text } from '@radix-ui/themes';
import { RocketIcon, PersonIcon } from '@radix-ui/react-icons';
import { formatStatus, getStatusColor, getTeamMemberStatusColor } from '@/lib/utils/format';

interface StatusBadgeProps {
  status: string;
  type?: 'project' | 'team-member';
  size?: '1' | '2' | '3';
  variant?: 'solid' | 'soft' | 'outline';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  type = 'project',
  size = '2',
  variant = 'soft',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const formattedStatus = formatStatus(status);

  const color = type === 'project' ? getStatusColor(status) : getTeamMemberStatusColor(status);

  const icon = type === 'project' ? RocketIcon : PersonIcon;
  const IconComponent = showIcon ? icon : null;

  return (
    <Badge
      color={
        color as
          | 'gray'
          | 'blue'
          | 'cyan'
          | 'green'
          | 'yellow'
          | 'orange'
          | 'red'
          | 'purple'
          | 'indigo'
          | 'pink'
      }
      size={size}
      variant={variant}
      radius="full"
      className={className}
    >
      <Flex gap="1" align="center">
        {IconComponent && <IconComponent />}
        <Text>{formattedStatus}</Text>
      </Flex>
    </Badge>
  );
}

/**
 * Project status badge
 */
export function ProjectStatusBadge({
  status,
  size = '2',
  variant = 'soft',
  className,
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="project"
      size={size}
      variant={variant}
      showIcon={true}
      className={className}
    />
  );
}

/**
 * Team member status badge
 */
export function TeamMemberStatusBadge({
  status,
  size = '1',
  variant = 'soft',
  className,
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="team-member"
      size={size}
      variant={variant}
      showIcon={false}
      className={className}
    />
  );
}
