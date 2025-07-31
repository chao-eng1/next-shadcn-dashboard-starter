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
import { PermissionDialog } from './permission-dialog';
import { Permission, Role } from '@prisma/client';
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

type PermissionWithRoles = Permission & {
  roles: {
    role: Role;
  }[];
  _count?: {
    roles: number;
    menus: number;
  };
};

interface PermissionsTableProps {
  permissions: PermissionWithRoles[];
}

export function PermissionsTable({ permissions }: PermissionsTableProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!permissionToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/system-management/permissions/${permissionToDelete}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete permission');
      }

      toast.success('Permission deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPermissionToDelete(null);
    }
  };

  const confirmDelete = (permissionId: string) => {
    setPermissionToDelete(permissionId);
    setIsDeleteDialogOpen(true);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const category = permission.name.split(':')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, PermissionWithRoles[]>
  );

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className='w-[80px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-24 text-center'>
                  No permissions found.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedPermissions)
                .map(([category, perms]) => (
                  <TableRow key={category} className='bg-muted/50'>
                    <TableCell colSpan={4} className='py-2'>
                      <span className='text-sm font-medium capitalize'>
                        {category}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
                .concat(
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className='font-medium'>
                        {permission.name}
                      </TableCell>
                      <TableCell>{permission.description || '-'}</TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-4'>
                          <div className='flex items-center space-x-1'>
                            <span className='text-muted-foreground text-xs'>
                              Roles:
                            </span>
                            <Badge variant='outline'>
                              {permission._count?.roles || 0}
                            </Badge>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <span className='text-muted-foreground text-xs'>
                              Menus:
                            </span>
                            <Badge variant='outline'>
                              {permission._count?.menus || 0}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
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
                            <PermissionDialog
                              mode='edit'
                              initialData={{
                                id: permission.id,
                                name: permission.name,
                                description: permission.description || ''
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
                              onClick={() => confirmDelete(permission.id)}
                            >
                              <IconTrash className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )
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
              permission and may affect roles that currently use it.
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
