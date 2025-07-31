/**
 * This is a script to test the RBAC system.
 * It checks if the database has the necessary data to run the RBAC system.
 *
 * Usage:
 * 1. Run this script with the node command:
 *    npx tsx src/lib/rbac-test.ts
 *
 * 2. The script will:
 *    - Check if users exist
 *    - Check if roles exist
 *    - Check if permissions exist
 *    - Check if users have roles
 *    - Check if roles have permissions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting RBAC System Test\n');

  // Check if users exist
  console.log('Checking users...');
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.error('❌ No users found in the database');
    console.log('💡 Run `npx prisma db seed` to seed the database');
    return;
  }
  console.log(`✅ Found ${users.length} users`);

  // Check if roles exist
  console.log('\nChecking roles...');
  const roles = await prisma.role.findMany();
  if (roles.length === 0) {
    console.error('❌ No roles found in the database');
    console.log('💡 Run `npx prisma db seed` to seed the database');
    return;
  }
  console.log(`✅ Found ${roles.length} roles`);

  // Check if permissions exist
  console.log('\nChecking permissions...');
  const permissions = await prisma.permission.findMany();
  if (permissions.length === 0) {
    console.error('❌ No permissions found in the database');
    console.log('💡 Run `npx prisma db seed` to seed the database');
    return;
  }
  console.log(`✅ Found ${permissions.length} permissions`);

  // Check if users have roles
  console.log('\nChecking user roles...');
  const userRoles = await prisma.userRole.findMany();
  if (userRoles.length === 0) {
    console.error('❌ No user roles found in the database');
    console.log('💡 Run `npx prisma db seed` to seed the database');
    return;
  }
  console.log(`✅ Found ${userRoles.length} user roles`);

  // Check if roles have permissions
  console.log('\nChecking role permissions...');
  const rolePermissions = await prisma.rolePermission.findMany();
  if (rolePermissions.length === 0) {
    console.error('❌ No role permissions found in the database');
    console.log('💡 Run `npx prisma db seed` to seed the database');
    return;
  }
  console.log(`✅ Found ${rolePermissions.length} role permissions`);

  // Check sample permissions for admin role
  console.log('\nChecking admin role permissions...');
  const adminRole = roles.find((role) => role.name === 'admin');
  if (!adminRole) {
    console.error('❌ Admin role not found');
    return;
  }

  const adminPermissions = await prisma.rolePermission.findMany({
    where: { roleId: adminRole.id },
    include: { permission: true }
  });

  if (adminPermissions.length === 0) {
    console.error('❌ Admin role has no permissions');
    return;
  }

  const requiredPermissions = [
    'user:list',
    'role:list',
    'permission:list',
    'menu:list'
  ];

  const missingPermissions = requiredPermissions.filter(
    (required) => !adminPermissions.some((p) => p.permission.name === required)
  );

  if (missingPermissions.length > 0) {
    console.error(
      `❌ Admin role is missing these permissions: ${missingPermissions.join(', ')}`
    );
  } else {
    console.log('✅ Admin role has all required permissions');
  }

  // Check if admin user has admin role
  console.log('\nChecking admin user role...');
  const adminUser = users.find((user) => user.email === 'admin@example.com');
  if (!adminUser) {
    console.error('❌ Admin user not found');
    return;
  }

  const adminUserRole = await prisma.userRole.findFirst({
    where: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });

  if (!adminUserRole) {
    console.error('❌ Admin user does not have admin role');
  } else {
    console.log('✅ Admin user has admin role');
  }

  console.log('\nRBAC System Test Completed Successfully!');
  console.log('\nLogin Credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('Error during RBAC test:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
