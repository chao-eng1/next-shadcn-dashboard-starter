import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { menuSchema } from '@/features/system-management/menus/schemas/menu-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Get all menus
export async function GET(req: NextRequest) {
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

    // Check if user has permission to list menus
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'menu:list'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get menus
    const menus = await prisma.menu.findMany({
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: [
        {
          parentId: 'asc'
        },
        {
          order: 'asc'
        }
      ]
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new menu
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

    // Check if user has permission to create menus
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'menu:create'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = menuSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      path,
      icon,
      parentId,
      order,
      isVisible,
      permissions: permissionIds
    } = validatedData.data;

    // Verify parent exists if provided
    if (parentId) {
      const parentExists = await prisma.menu.findUnique({
        where: { id: parentId }
      });

      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent menu not found' },
          { status: 400 }
        );
      }
    }

    // Create menu and assign permissions in a transaction
    const newMenu = await prisma.$transaction(async (tx) => {
      // Create menu
      const menu = await tx.menu.create({
        data: {
          name,
          path,
          icon,
          parentId,
          order,
          isVisible
        }
      });

      // Assign permissions
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId) =>
            tx.menuPermission.create({
              data: {
                menuId: menu.id,
                permissionId
              }
            })
          )
        );
      }

      return menu;
    });

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
