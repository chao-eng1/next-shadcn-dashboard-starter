import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create basic permissions if they don't exist
  const basicPermissions = [
    // User permissions
    { name: 'user:create', description: 'Permission to create users' },
    { name: 'user:read', description: 'Permission to view user details' },
    { name: 'user:update', description: 'Permission to update users' },
    { name: 'user:delete', description: 'Permission to delete users' },
    { name: 'user:list', description: 'Permission to list all users' },

    // Role permissions
    { name: 'role:create', description: 'Permission to create roles' },
    { name: 'role:read', description: 'Permission to view role details' },
    { name: 'role:update', description: 'Permission to update roles' },
    { name: 'role:delete', description: 'Permission to delete roles' },
    { name: 'role:list', description: 'Permission to list all roles' },

    // Permission permissions
    {
      name: 'permission:create',
      description: 'Permission to create permissions'
    },
    {
      name: 'permission:read',
      description: 'Permission to view permission details'
    },
    {
      name: 'permission:update',
      description: 'Permission to update permissions'
    },
    {
      name: 'permission:delete',
      description: 'Permission to delete permissions'
    },
    {
      name: 'permission:list',
      description: 'Permission to list all permissions'
    },

    // Menu permissions
    { name: 'menu:create', description: 'Permission to create menus' },
    { name: 'menu:read', description: 'Permission to view menu details' },
    { name: 'menu:update', description: 'Permission to update menus' },
    { name: 'menu:delete', description: 'Permission to delete menus' },
    { name: 'menu:list', description: 'Permission to list all menus' },

    // System documentation permissions
    {
      name: 'system:docs',
      description: 'Permission to view system documentation'
    },

    // Dashboard permissions
    { name: 'dashboard:view', description: 'Permission to view dashboard' },

    // Product permissions
    { name: 'product:create', description: 'Permission to create products' },
    { name: 'product:read', description: 'Permission to view product details' },
    { name: 'product:update', description: 'Permission to update products' },
    { name: 'product:delete', description: 'Permission to delete products' },
    { name: 'product:list', description: 'Permission to list all products' },

    // Kanban permissions
    { name: 'kanban:view', description: 'Permission to view kanban board' },
    { name: 'kanban:update', description: 'Permission to update kanban items' }
  ];

  console.log('Creating permissions...');
  const createdPermissions = [];
  for (const permission of basicPermissions) {
    const existingPermission = await prisma.permission.findUnique({
      where: { name: permission.name }
    });

    if (!existingPermission) {
      const newPermission = await prisma.permission.create({
        data: permission
      });
      createdPermissions.push(newPermission);
    } else {
      createdPermissions.push(existingPermission);
    }
  }

  console.log(`Created/verified ${createdPermissions.length} permissions`);

  // Create admin role if it doesn't exist
  let adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator with full system access'
      }
    });
    console.log('Created admin role');
  } else {
    console.log('Admin role already exists');
  }

  // Create user role if it doesn't exist
  let userRole = await prisma.role.findUnique({
    where: { name: 'user' }
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'user',
        description: 'Regular user with limited access'
      }
    });
    console.log('Created user role');
  } else {
    console.log('User role already exists');
  }

  // Assign all permissions to admin role
  console.log('Assigning permissions to admin role...');
  for (const permission of createdPermissions) {
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
    }
  }

  // Assign basic permissions to user role
  console.log('Assigning permissions to user role...');
  const userPermissions = [
    'dashboard:view',
    'product:read',
    'product:list',
    'kanban:view'
  ];
  for (const permissionName of userPermissions) {
    const permission = createdPermissions.find(
      (p) => p.name === permissionName
    );
    if (permission) {
      const existingRolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: userRole.id,
          permissionId: permission.id
        }
      });

      if (!existingRolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });
      }
    }
  }

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  // Check if admin already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    const hashedPassword = await hash(adminPassword, 12);

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        passwordHash: hashedPassword
      }
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID: ${adminUser.id}`);
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create test user
  const userEmail = 'user@example.com';
  const userPassword = 'user123';

  // Check if test user already exists
  let testUser = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!testUser) {
    const hashedPassword = await hash(userPassword, 12);

    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: userEmail,
        passwordHash: hashedPassword
      }
    });

    console.log('✅ Test user created:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   User ID: ${testUser.id}`);
  } else {
    console.log('ℹ️ Test user already exists');
  }

  // Assign admin role to admin user
  const adminUserRole = await prisma.userRole.findFirst({
    where: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });

  if (!adminUserRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    console.log('Assigned admin role to admin user');
  }

  // Assign user role to test user
  const testUserRole = await prisma.userRole.findFirst({
    where: {
      userId: testUser.id,
      roleId: userRole.id
    }
  });

  if (!testUserRole) {
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: userRole.id
      }
    });
    console.log('Assigned user role to test user');
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
