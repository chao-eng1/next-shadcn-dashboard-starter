'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RoleDialog } from './role-dialog';
import { Role, Permission } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type RoleWithPermissions = Role & {
  permissions: {
    permission: Permission;
  }[];
  _count?: {
    users: number;
  };
};

interface RolesTableProps {
  roles: RoleWithPermissions[];
  permissions?: Permission[];
}

export function RolesTable({ roles, permissions = [] }: RolesTableProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/system-management/roles/${roleToDelete}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete role');
      }

      toast.success('Role deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const confirmDelete = (roleId: string) => {
    setRoleToDelete(roleId);
    setIsDeleteDialogOpen(true);
  };

  // Group permissions by category
  const getPermissionGroups = (permissions: { permission: Permission }[]) => {
    const groups = permissions.reduce(
      (acc, { permission }) => {
        const group = permission.name.split(':')[0];
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>
    );

    return groups;
  };

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className='w-[80px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const permissionGroups = getPermissionGroups(role.permissions);
                return (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>{role.name}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        {Object.entries(permissionGroups).map(
                          ([group, permissions]) => (
                            <div key={group} className='flex flex-wrap gap-1'>
                              <Badge
                                variant='outline'
                                className='mb-1 capitalize'
                              >
                                {group}
                              </Badge>
                              <div className='flex flex-wrap gap-1'>
                                {permissions.map((permission) => (
                                  <Badge
                                    key={permission.id}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {permission.name.split(':')[1]}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{role._count?.users || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <IconDotsVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <RoleDialog
                            mode='edit'
                            permissions={permissions}
                            initialData={{
                              id: role.id,
                              name: role.name,
                              description: role.description || '',
                              permissions: role.permissions.map(
                                (p) => p.permission.id
                              )
                            }}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <IconPencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => confirmDelete(role.id)}
                          >
                            <IconTrash className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              role and remove it from all assigned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
