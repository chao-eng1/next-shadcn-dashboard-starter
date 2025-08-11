import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { roleSchema } from '@/features/system-management/roles/schemas/role-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  roleId: string;
}

// Get a specific role by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { roleId } = await params;
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

    // Check if user has permission to view roles
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'role:read'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { roleId } = await params;
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

    // Check if user has permission to update roles
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'role:update'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = roleSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      permissions: permissionIds
    } = validatedData.data;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if name is being changed and is already taken
    if (name !== existingRole.name) {
      const roleWithName = await prisma.role.findUnique({
        where: { name }
      });

      if (roleWithName && roleWithName.id !== roleId) {
        return NextResponse.json(
          { error: 'Role name is already taken' },
          { status: 400 }
        );
      }
    }

    // Update role and permissions in a transaction
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update role basic info
      const role = await tx.role.update({
        where: { id: roleId },
        data: {
          name,
          description
        }
      });

      // Update permissions
      // Remove current permissions
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId) =>
            tx.rolePermission.create({
              data: {
                roleId,
                permissionId
              }
            })
          )
        );
      }

      return role;
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { roleId } = await params;
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

    // Check if user has permission to delete roles
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'role:delete'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent deletion of the 'admin' role or any role currently assigned to users
    if (
      existingRole.name.toLowerCase() === 'admin' ||
      existingRole.name.toLowerCase() === 'administrator'
    ) {
      return NextResponse.json(
        { error: 'Cannot delete the administrator role' },
        { status: 400 }
      );
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete a role that is assigned to users. Please remove all users from this role first.'
        },
        { status: 400 }
      );
    }

    // Delete role (cascade will remove permissions)
    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
