import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { seedBasicPermissions } from '@/features/system-management/permissions/components/seed-basic-permissions';
import { prisma } from '@/lib/prisma';

// POST /api/system-management/permissions/seed-basic - Seed basic permissions and assign to admin
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
        { error: 'Only administrators can seed permissions' },
        { status: 403 }
      );
    }

    // Seed basic permissions
    const result = await seedBasicPermissions();

    if (result.success) {
      return NextResponse.json({
        message: result.message
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
