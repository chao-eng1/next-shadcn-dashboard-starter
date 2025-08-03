import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import {
  apiResponse,
  apiUnauthorized,
  apiBadRequest
} from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const permission = searchParams.get('permission');

    if (!permission) {
      return apiBadRequest('Permission parameter is required');
    }

    const { projectId } = await params;

    // 检查用户在项目中的权限
    const hasPermissionResult = await hasProjectPermission(
      projectId,
      permission,
      user.id
    );

    return apiResponse({ hasPermission: hasPermissionResult });
  } catch (error) {
    console.error('Failed to check project permission:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
