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

  // Check if user has permission to edit this project
  const userPermission = project.permissions?.find(
    (p: { user_id: string; role: string }) => p.user_id === user.id,
  );

  if (!userPermission || !['owner', 'admin', 'editor'].includes(userPermission.role)) {
    notFound();
  }

  return <EditProjectContent project={project} />;
}
