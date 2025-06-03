import { getCurrentUser } from '@/lib/supabase/client';
import { ProjectsList } from '@/components/projects/ProjectsList';

export const metadata = {
  title: 'Projects | DeepVest',
  description: 'View all projects on the DeepVest platform',
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const isAuthenticated = !!user;

  return <ProjectsList isAuthenticated={isAuthenticated} />;
}
