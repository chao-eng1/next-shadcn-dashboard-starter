import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { messagePermissions } from '@/features/system-management/permissions/components/seed-permissions';

// POST /api/system-management/permissions/seed-message - Seed message permissions and assign to admin
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const userId = payload.userId as string;

    const prisma = new PrismaClient();

    try {
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

      // Get admin role
      const adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
      });

      if (!adminRole) {
        return NextResponse.json(
          { error: 'Admin role not found' },
          { status: 404 }
        );
      }

      // Create permissions if they don't exist
      const createdPermissions = [];

      // Create both dot and colon versions of permissions
      const allPermissions = [
        ...messagePermissions,
        // Add colon versions
        ...messagePermissions.map((p) => ({
          name: p.name.replace('.', ':'),
          description: p.description
        }))
      ];

      for (const permission of allPermissions) {
        const existingPermission = await prisma.permission.findUnique({
          where: { name: permission.name }
        });

        if (!existingPermission) {
          const newPermission = await prisma.permission.create({
            data: {
              name: permission.name,
              description: permission.description
            }
          });
          createdPermissions.push(newPermission);

          // Assign to admin role
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: newPermission.id
            }
          });
        } else {
          // Check if admin role has this permission
          const roleHasPermission = await prisma.rolePermission.findFirst({
            where: {
              roleId: adminRole.id,
              permissionId: existingPermission.id
            }
          });

          if (!roleHasPermission) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: existingPermission.id
              }
            });
          }
        }
      }

      return NextResponse.json({
        message: `Seeded ${createdPermissions.length} new message permissions`,
        permissions: createdPermissions
      });
    } catch (error) {
      console.error('Error seeding permissions:', error);
      return NextResponse.json(
        { error: 'Failed to seed permissions' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
