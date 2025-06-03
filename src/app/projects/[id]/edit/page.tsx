import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { checkUserProjectRole, getProjectWithDetails } from '@/lib/supabase/helpers';
import { Heading, Container, Text, Box } from '@radix-ui/themes';
import EditProjectForm from './EditProjectForm';

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

  return (
    <Container size="2" py="6">
      <Box mb="6">
        <Heading size="6" mb="2">
          Edit Project
        </Heading>
        <Text size="2" color="gray">
          Make changes to your project. A new draft will be created until you publish your changes.
        </Text>
      </Box>
      <EditProjectForm
        project={project}
        userFullName={userProfile?.full_name || ''}
        userEmail={user.email || ''}
      />
    </Container>
  );
}
