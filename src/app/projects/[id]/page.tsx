import { notFound } from 'next/navigation';
import { ExclamationTriangleIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import {
  getProjectWithDetails,
  getPublicProjectDocuments,
  getPublicProjectTeamMembers,
} from '@/lib/supabase/helpers';
import { getCurrentUser } from '@/lib/supabase/client';
import { checkUserProjectRole, getProjectCoreStatus } from '@/lib/supabase/helpers';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { TeamMember } from '@/types/supabase';
import { ProjectContent } from '@/components/projects';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params: paramsPromise }: ProjectPageProps) {
  const params = await paramsPromise;
  const { id } = params;
  const { data: projectWithDetails, error } = await getProjectWithDetails(id);

  if (error || !projectWithDetails) {
    return {
      title: 'Project Not Found | DeepVest',
      description: 'The requested project was not found or access was denied.',
    };
  }

  const snapshotForMeta = projectWithDetails.public_snapshot || projectWithDetails.new_snapshot;

  const projectName = snapshotForMeta?.name || 'Project';
  const projectDescription =
    snapshotForMeta?.description || 'View project details on DeepVest platform';

  return {
    title: `${projectName} | DeepVest`,
    description: projectDescription,
  };
}

export default async function ProjectPage({ params: paramsPromise }: ProjectPageProps) {
  const params = await paramsPromise;
  const { id } = params;
  const user = await getCurrentUser();

  const { data: projectStatusArray, error: rpcError } = await getProjectCoreStatus(id);

  if (rpcError || !projectStatusArray || projectStatusArray.length === 0) {
    notFound();
  }

  const { is_public: isPublic, is_archived: isArchived } = projectStatusArray[0];

  if (isArchived) {
    return (
      <div className="container mx-auto my-10 flex flex-col items-center justify-center text-center">
        <ExclamationTriangleIcon className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-3xl font-bold">Project Archived</h1>
        <p className="text-lg text-gray-600">
          This project has been archived and is not currently accessible.
        </p>
      </div>
    );
  }

  if (!isPublic && !user) {
    return (
      <div className="container mx-auto my-10 flex flex-col items-center justify-center text-center">
        <EyeClosedIcon className="mb-4 h-16 w-16 text-blue-500" />
        <h1 className="mb-2 text-3xl font-bold">Project Temporarily Unavailable</h1>
        <p className="text-lg text-gray-600">
          This project is currently private. Please sign in or contact the owner for access.
        </p>
      </div>
    );
  }

  const { data: project, error } = await getProjectWithDetails(id);

  if (error || !project) {
    if (user) {
      return (
        <div className="container mx-auto my-10 flex flex-col items-center justify-center text-center">
          <ExclamationTriangleIcon className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
          <p className="text-lg text-gray-600">You do not have permission to view this project.</p>
        </div>
      );
    }
    notFound();
  }

  let userRole = null;
  if (user) {
    const hasAccess = await checkUserProjectRole(user.id, id, 'viewer');
    if (hasAccess) {
      const userPermission = project.permissions?.find(
        (permission: { user_id: string; role: string }) => permission.user_id === user.id,
      );
      userRole = userPermission?.role || 'viewer';
    } else if (!isPublic) {
      return (
        <div className="container mx-auto my-10 flex flex-col items-center justify-center text-center">
          <ExclamationTriangleIcon className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
          <p className="text-lg text-gray-600">
            This project is private and you do not have explicit permission to view it.
          </p>
        </div>
      );
    }
  }

  const { data: documentsData } = await getPublicProjectDocuments(id);
  const { data: team }: { data: TeamMember[] | null } = await getPublicProjectTeamMembers(id);

  // Convert ProjectContentWithAuthor to ProjectDocumentWithAuthor
  const documents: ProjectDocumentWithAuthor[] = (documentsData || []).map(doc => ({
    id: doc.id,
    project_id: doc.project_id,
    title: doc.title,
    slug: doc.slug,
    content_type: doc.content_type,
    content: doc.content,
    description: doc.description,
    file_urls: doc.file_urls,
    author_id: doc.author_id,
    is_public: doc.is_public,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    deleted_at: doc.deleted_at,
    author: doc.author
      ? {
          id: doc.author.id,
          full_name: doc.author.full_name || '',
        }
      : null,
  }));

  return (
    <ProjectContent
      project={project}
      documents={documents}
      team={team || []}
      isAuthenticated={!!user}
      userId={user?.id}
      userRole={userRole}
    />
  );
}
