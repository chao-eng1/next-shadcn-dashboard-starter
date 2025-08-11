import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userUpdateSchema } from '@/features/system-management/users/schemas/user-schema';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

interface Params {
  userId: string;
}

// Get a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const requestingUser = await prisma.user.findUnique({
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

    // Check if requesting user has permission to view users
    const hasPermission = requestingUser?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'user:read'
      )
    );

    // Users can always view their own profile
    const isSelfView = requestingUser?.id === userId;

    if (!hasPermission && !isSelfView) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive information
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const requestingUser = await prisma.user.findUnique({
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

    // Check if requesting user has permission to update users
    const hasPermission = requestingUser?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'user:update'
      )
    );

    // Users can always update their own profile
    const isSelfUpdate = requestingUser?.id === userId;

    if (!hasPermission && !isSelfUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = userUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, roles: roleIds, image } = validatedData.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and is already taken
    if (email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (userWithEmail && userWithEmail.id !== userId) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user and roles in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const updateData: any = {
        name,
        email,
        image
      };

      // Only update password if provided
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      const user = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      // Update roles if provided (and user has permission)
      if (roleIds && hasPermission) {
        // Only admins can change roles
        // Remove current roles
        await tx.userRole.deleteMany({
          where: { userId }
        });

        // Add new roles
        if (roleIds.length > 0) {
          await Promise.all(
            roleIds.map((roleId) =>
              tx.userRole.create({
                data: {
                  userId,
                  roleId
                }
              })
            )
          );
        }
      }

      return user;
    });

    // Remove password hash from response
    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check permissions
    const payload = await verifyAuth(token);
    const requestingUser = await prisma.user.findUnique({
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

    // Check if requesting user has permission to delete users
    const hasPermission = requestingUser?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === 'user:delete'
      )
    );

    // Prevent self-deletion as a safeguard
    const isSelfDelete = requestingUser?.id === userId;

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    if (isSelfDelete) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will remove roles)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
