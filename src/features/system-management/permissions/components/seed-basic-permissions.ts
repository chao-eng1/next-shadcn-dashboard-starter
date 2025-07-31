import { PrismaClient } from '@prisma/client';

export const basicPermissions = [
  // User permissions
  {
    name: 'user:list',
    description: 'Can list all users'
  },
  {
    name: 'user:view',
    description: 'Can view user details'
  },
  {
    name: 'user:create',
    description: 'Can create new users'
  },
  {
    name: 'user:update',
    description: 'Can update existing users'
  },
  {
    name: 'user:delete',
    description: 'Can delete users'
  },

  // Role permissions
  {
    name: 'role:list',
    description: 'Can list all roles'
  },
  {
    name: 'role:view',
    description: 'Can view role details'
  },
  {
    name: 'role:create',
    description: 'Can create new roles'
  },
  {
    name: 'role:update',
    description: 'Can update existing roles'
  },
  {
    name: 'role:delete',
    description: 'Can delete roles'
  },

  // Permission permissions
  {
    name: 'permission:list',
    description: 'Can list all permissions'
  },
  {
    name: 'permission:view',
    description: 'Can view permission details'
  },
  {
    name: 'permission:create',
    description: 'Can create new permissions'
  },
  {
    name: 'permission:update',
    description: 'Can update existing permissions'
  },
  {
    name: 'permission:delete',
    description: 'Can delete permissions'
  }
];

export async function seedBasicPermissions() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting to seed basic permissions...');

    // Check if permissions already exist
    const existingPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: basicPermissions.map((p) => p.name)
        }
      }
    });

    const existingNames = existingPermissions.map((p) => p.name);

    // Create permissions that don't exist yet
    const permissionsToCreate = basicPermissions.filter(
      (p) => !existingNames.includes(p.name)
    );

    let createdPermissions = [];

    if (permissionsToCreate.length > 0) {
      const result = await prisma.permission.createMany({
        data: permissionsToCreate,
        skipDuplicates: true
      });

      console.log(`Created ${result.count} basic permissions`);

      // Get the newly created permissions for role assignment
      createdPermissions = await prisma.permission.findMany({
        where: {
          name: {
            in: permissionsToCreate.map((p) => p.name)
          }
        }
      });
    } else {
      console.log('All basic permissions already exist');
    }

    // Assign permissions to admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (adminRole) {
      console.log('Found admin role, assigning permissions...');

      // Get all permissions (both existing and newly created)
      const allPermissions = [...existingPermissions, ...createdPermissions];

      // Assign each permission to admin role if not already assigned
      for (const permission of allPermissions) {
        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });

        if (!existingRolePermission) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });
          console.log(`Assigned ${permission.name} permission to admin role`);
        }
      }

      console.log('Completed assigning permissions to admin role');
    } else {
      console.log('Admin role not found');
    }

    return {
      success: true,
      message: `Basic permissions setup completed. Created ${createdPermissions.length} new permissions.`
    };
  } catch (error) {
    console.error('Error seeding basic permissions:', error);
    return {
      success: false,
      message: `Error seeding basic permissions: ${error.message}`
    };
  } finally {
    await prisma.$disconnect();
  }
}
