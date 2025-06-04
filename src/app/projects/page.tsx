import { getCurrentUser } from '@/lib/supabase/client';
import { getAllVisibleProjects } from '@/lib/supabase/helpers';
import { ProjectsList } from '@/components/projects';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projects | DeepVest',
  description: 'View all projects on the DeepVest platform',
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const isAuthenticated = !!user;

  // Fetch projects on server side using the refactored helper
  const { data: projects, error } = await getAllVisibleProjects(user?.id);

  if (error) {
    console.error('Failed to load projects:', error);
  }

  return (
    <ProjectsList
      isAuthenticated={isAuthenticated}
      initialProjects={projects || []}
      error={error}
    />
  );
}
