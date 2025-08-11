/* eslint-disable @typescript-eslint/no-unused-vars */
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { permissionSchema } from '@/features/system-management/permissions/schemas/permission-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Get all permissions
export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check for permissions
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

    // Check if user has permission to list permissions
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'permission:list'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get permissions
    const permissions = await prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            roles: true,
            menus: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new permission
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check for permissions
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

    // Check if user has permission to create permissions
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) =>
          rolePermission.permission.name === 'permission:create'
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

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name }
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this name already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const newPermission = await prisma.permission.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
