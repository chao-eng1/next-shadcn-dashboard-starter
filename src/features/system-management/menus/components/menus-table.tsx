'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconTrash
} from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Menu, Permission } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MenuDialog } from './menu-dialog';
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
import { Icons } from '@/components/icons';

type MenuWithRelations = Menu & {
  parent?: Menu | null;
  children?: MenuWithRelations[];
  permissions: {
    permission: Permission;
  }[];
};

interface MenusTableProps {
  menus: MenuWithRelations[];
  permissions?: Permission[];
}

export function MenusTable({ menus, permissions = [] }: MenusTableProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Organize menus into a hierarchy
  const rootMenus = menus.filter((menu) => !menu.parentId);

  // Sort by order field
  rootMenus.sort((a, b) => a.order - b.order);

  const handleDelete = async () => {
    if (!menuToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/system-management/menus/${menuToDelete}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete menu');
      }

      toast.success('Menu deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const confirmDelete = (menuId: string) => {
    setMenuToDelete(menuId);
    setIsDeleteDialogOpen(true);
  };

  // Recursive function to render menu rows with proper indentation
  const renderMenuRows = (menus: MenuWithRelations[], level = 0) => {
    const rows: JSX.Element[] = [];

    menus
      .sort((a, b) => a.order - b.order)
      .forEach((menu) => {
        const IconComponent = menu.icon
          ? Icons[menu.icon as keyof typeof Icons]
          : null;

        rows.push(
          <TableRow key={menu.id}>
            <TableCell>
              <div
                className='flex items-center'
                style={{ paddingLeft: `${level * 20}px` }}
              >
                {IconComponent && <IconComponent className='mr-2 h-4 w-4' />}
                <span className='font-medium'>{menu.name}</span>
              </div>
            </TableCell>
            <TableCell>{menu.path || '-'}</TableCell>
            <TableCell className='text-center'>
              {menu.isVisible ? (
                <IconEye className='inline-block h-4 w-4 text-green-500' />
              ) : (
                <IconEyeOff className='text-muted-foreground inline-block h-4 w-4' />
              )}
            </TableCell>
            <TableCell>{menu.order}</TableCell>
            <TableCell>
              <div className='flex flex-wrap gap-1'>
                {menu.permissions.map(({ permission }) => (
                  <Badge
                    key={permission.id}
                    variant='secondary'
                    className='text-xs'
                  >
                    {permission.name}
                  </Badge>
                ))}
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
                  <MenuDialog
                    menus={menus.filter((m) => m.id !== menu.id)}
                    permissions={permissions}
                    mode='edit'
                    initialData={{
                      id: menu.id,
                      name: menu.name,
                      path: menu.path || '',
                      icon: menu.icon || '',
                      order: menu.order,
                      isVisible: menu.isVisible,
                      parentId: menu.parentId || '',
                      permissions: menu.permissions.map((p) => p.permission.id)
                    }}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <IconPencil className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => confirmDelete(menu.id)}
                  >
                    <IconTrash className='mr-2 h-4 w-4' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );

        // Recursively add children if any
        if (menu.children && menu.children.length > 0) {
          rows.push(...renderMenuRows(menu.children, level + 1));
        }
      });

    return rows;
  };

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Menu Name</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className='text-center'>Visible</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Required Permissions</TableHead>
              <TableHead className='w-[80px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rootMenus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  No menus found.
                </TableCell>
              </TableRow>
            ) : (
              renderMenuRows(rootMenus)
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
              menu and all its child menus.
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
