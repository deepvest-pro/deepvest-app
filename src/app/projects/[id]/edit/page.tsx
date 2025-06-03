import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { checkUserProjectRole, getProjectWithDetails } from '@/lib/supabase/helpers';
import { EditProjectContent } from '@/components/projects/EditProjectContent';

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check if user has editor permissions or higher
  const hasEditAccess = await checkUserProjectRole(user.id, id, 'editor');

  if (!hasEditAccess) {
    redirect(`/projects/${id}`);
  }

  // Fetch project details
  const { data: project, error } = await getProjectWithDetails(id);

  if (error || !project) {
    notFound();
  }

  // Fetch user profile for form initialization
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Get user role for the project
  const userPermission = project.permissions?.find(
    (permission: { user_id: string; role: string }) => permission.user_id === user.id,
  );
  const userRole = userPermission?.role || 'viewer';

  return (
    <EditProjectContent
      project={project}
      userFullName={userProfile?.full_name || ''}
      userEmail={user.email || ''}
      userRole={userRole}
    />
  );
}
