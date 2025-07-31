import { PrismaClient } from '@prisma/client';

export const messagePermissions = [
  {
    name: 'message.send',
    description: 'Can send messages to users'
  },
  {
    name: 'message.read',
    description: 'Can read messages'
  },
  {
    name: 'message.manage',
    description: 'Can manage all messages in the system'
  },
  {
    name: 'message.edit',
    description: 'Can edit existing messages'
  },
  {
    name: 'message.delete',
    description: 'Can delete messages'
  }
];

export async function seedMessagePermissions() {
  const prisma = new PrismaClient();

  try {
    // Check if permissions already exist
    const existingPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: messagePermissions.map((p) => p.name)
        }
      }
    });

    const existingNames = existingPermissions.map((p) => p.name);

    // Create permissions that don't exist yet
    const permissionsToCreate = messagePermissions.filter(
      (p) => !existingNames.includes(p.name)
    );

    if (permissionsToCreate.length > 0) {
      await prisma.permission.createMany({
        data: permissionsToCreate
      });

      console.log(`Created ${permissionsToCreate.length} message permissions`);
    } else {
      console.log('Message permissions already exist');
    }

    // Assign message.manage permission to admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (adminRole) {
      const managePermission = await prisma.permission.findFirst({
        where: { name: 'message.manage' }
      });

      if (managePermission) {
        // Check if relationship already exists
        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: adminRole.id,
            permissionId: managePermission.id
          }
        });

        if (!existingRolePermission) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: managePermission.id
            }
          });

          console.log('Assigned message.manage permission to admin role');
        }
      }
    }
  } catch (error) {
    console.error('Error seeding message permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}
