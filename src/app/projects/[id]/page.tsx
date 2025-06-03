import { getProjectWithDetails } from '@/lib/supabase/helpers';
import { notFound } from 'next/navigation';
import { getCurrentUser, createServerSupabaseClient } from '@/lib/supabase/client';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { ExclamationTriangleIcon, EyeClosedIcon } from '@radix-ui/react-icons';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: {
    id: string;
  };
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
  const supabase = await createServerSupabaseClient();

  // 1. Check project existence and public status using RPC
  const { data: projectStatusResult, error: rpcError } = await supabase.rpc(
    'get_project_status_by_id',
    { p_project_id: id },
  );

  // supabase.rpc can return data in a different shape, ensure it's an array for projectStatus
  const projectStatusArray = Array.isArray(projectStatusResult)
    ? projectStatusResult
    : projectStatusResult?.data
      ? [projectStatusResult.data]
      : [];

  if (rpcError || !projectStatusArray || projectStatusArray.length === 0) {
    console.error(
      '[ProjectPage] RPC error or project not found via RPC. Project ID:',
      id,
      'RPC Error:',
      rpcError,
      'Status Result:',
      projectStatusArray,
    );
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

  // 2. If project is not public and user is a guest, show "temporarily unavailable"
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

  // 3. If project is public OR user is authenticated, proceed to fetch full details
  const { data: project, error } = await getProjectWithDetails(id);

  if (error || !project) {
    console.error(
      '[ProjectPage] Error fetching project details after RPC check or project is null. Project ID:',
      id,
      'Error:',
      error,
    );
    if (user) {
      return (
        <div className="container mx-auto my-10 flex flex-col items-center justify-center text-center">
          <ExclamationTriangleIcon className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
          <p className="text-lg text-gray-600">You do not have permission to view this project.</p>
        </div>
      );
    }
    notFound(); // Should not happen if RPC worked and project is public.
  }

  // 4. Check user's role for the project if authenticated
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

  return (
    <ProjectDetails
      project={project}
      isAuthenticated={!!user}
      userId={user?.id}
      userRole={userRole}
    />
  );
}
