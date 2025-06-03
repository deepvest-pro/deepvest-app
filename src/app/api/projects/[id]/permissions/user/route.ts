import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]/permissions/user
 * Get the current user's role in the project
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = params;

  // Get the current user's permissions for this project
  const { data, error } = await supabase
    .from('project_permissions')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No permission found
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
