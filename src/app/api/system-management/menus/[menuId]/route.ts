import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { menuSchema } from '@/features/system-management/menus/schemas/menu-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  menuId: string;
}

// Get a specific menu by ID
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { menuId } = params;
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

    // Check if user has permission to view menus
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'menu:read'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a menu
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const { menuId } = params;
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

    // Check if user has permission to update menus
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'menu:update'
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

    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId }
    });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    // Verify parent exists if provided
    if (parentId) {
      // Prevent circular references
      if (parentId === menuId) {
        return NextResponse.json(
          { error: 'Menu cannot be its own parent' },
          { status: 400 }
        );
      }

      const parentExists = await prisma.menu.findUnique({
        where: { id: parentId }
      });

      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent menu not found' },
          { status: 400 }
        );
      }

      // Check if parentId would create a circular reference
      // Get all descendants of the current menu
      const checkCircularReference = async (
        menuId: string,
        potentialParentId: string
      ): Promise<boolean> => {
        if (menuId === potentialParentId) return true;

        const children = await prisma.menu.findMany({
          where: { parentId: menuId }
        });

        for (const child of children) {
          if (await checkCircularReference(child.id, potentialParentId)) {
            return true;
          }
        }

        return false;
      };

      const wouldCreateCircularRef = await checkCircularReference(
        menuId,
        parentId
      );
      if (wouldCreateCircularRef) {
        return NextResponse.json(
          { error: 'Cannot set parent: would create circular reference' },
          { status: 400 }
        );
      }
    }

    // Update menu and permissions in a transaction
    const updatedMenu = await prisma.$transaction(async (tx) => {
      // Update menu basic info
      const menu = await tx.menu.update({
        where: { id: menuId },
        data: {
          name,
          path,
          icon,
          parentId,
          order,
          isVisible
        }
      });

      // Update permissions
      // Remove current permissions
      await tx.menuPermission.deleteMany({
        where: { menuId }
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId) =>
            tx.menuPermission.create({
              data: {
                menuId,
                permissionId
              }
            })
          )
        );
      }

      return menu;
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a menu
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const { menuId } = params;
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

    // Check if user has permission to delete menus
    const hasPermission = user?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'menu:delete'
      )
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        children: true
      }
    });

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    // Check if menu has children
    if (existingMenu.children.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete a menu with child menus. Please delete or reassign its children first.'
        },
        { status: 400 }
      );
    }

    // Delete menu (cascade will remove permissions)
    await prisma.menu.delete({
      where: { id: menuId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
