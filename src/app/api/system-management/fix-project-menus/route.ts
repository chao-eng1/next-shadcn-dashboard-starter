import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { assignAdminProjectPermissions } from '@/lib/permissions-utils';
import {
  addProjectMenus,
  ensureSystemManagementMenu
} from '../../../../../prisma/seed/project-menus';

// POST /api/system-management/fix-project-menus - Fix project management menus and permissions
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const userId = payload.userId as string;

    // First, check if user is an admin
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const isAdmin = userWithRoles?.roles.some(
      (userRole) => userRole.role.name === 'admin'
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can fix menus and permissions' },
        { status: 403 }
      );
    }

    // 1. Fix admin project permissions
    const permissionsResult = await assignAdminProjectPermissions();

    if (!permissionsResult.success) {
      return NextResponse.json(
        { error: permissionsResult.message },
        { status: 500 }
      );
    }

    // 2. Add project management menus
    await addProjectMenus();

    // 3. Ensure system management menu
    await ensureSystemManagementMenu();

    return NextResponse.json({
      success: true,
      message: '项目管理菜单和权限修复成功'
    });
  } catch (error) {
    console.error('Fix project menus error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
