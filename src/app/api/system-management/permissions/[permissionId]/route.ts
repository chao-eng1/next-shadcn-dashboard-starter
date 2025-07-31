import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { permissionSchema } from '@/features/system-management/permissions/schemas/permission-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  permissionId: string;
}

// Get a specific permission by ID
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { permissionId } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Check if user has permission to view permissions
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'permission:read'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        menus: {
          include: {
            menu: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a permission
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const { permissionId } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Check if user has permission to update permissions
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) =>
          rolePermission.permission.name === 'permission:update'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = permissionSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { name, description } = validatedData.data;

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and is already taken
    if (name !== existingPermission.name) {
      const permissionWithName = await prisma.permission.findUnique({
        where: { name }
      });

      if (permissionWithName && permissionWithName.id !== permissionId) {
        return NextResponse.json(
          { error: 'Permission name is already taken' },
          { status: 400 }
        );
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name,
        description
      }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a permission
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const { permissionId } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Check if user has permission to delete permissions
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) =>
          rolePermission.permission.name === 'permission:delete'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: {
            roles: true,
            menus: true
          }
        }
      }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of essential permissions
    const essentialPermissions = [
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'user:list',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'role:list',
      'permission:create',
      'permission:read',
      'permission:update',
      'permission:delete',
      'permission:list'
    ];

    if (essentialPermissions.includes(existingPermission.name)) {
      return NextResponse.json(
        { error: 'Cannot delete essential system permissions' },
        { status: 400 }
      );
    }

    // Check if permission is in use
    if (
      existingPermission._count.roles > 0 ||
      existingPermission._count.menus > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete a permission that is in use. Please remove from all roles and menus first.'
        },
        { status: 400 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
