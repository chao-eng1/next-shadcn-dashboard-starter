import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Management',
  description: 'System management dashboard'
};

export default function SystemManagementPage() {
  return (
    <div className='mx-auto max-w-7xl flex-1 space-y-4 p-6 pt-6 md:p-10'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>System Management</h2>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='bg-card text-card-foreground rounded-xl border shadow'>
          <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
            <h3 className='text-sm font-medium tracking-tight'>Total Users</h3>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          </div>
          <div className='p-6 pt-0'>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-muted-foreground text-xs'>
              +20.1% from last month
            </p>
          </div>
        </div>
        <div className='bg-card text-card-foreground rounded-xl border shadow'>
          <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
            <h3 className='text-sm font-medium tracking-tight'>Active Roles</h3>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
              <path d='M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          </div>
          <div className='p-6 pt-0'>
            <div className='text-2xl font-bold'>56</div>
            <p className='text-muted-foreground text-xs'>+2 new this month</p>
          </div>
        </div>
        <div className='bg-card text-card-foreground rounded-xl border shadow'>
          <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
            <h3 className='text-sm font-medium tracking-tight'>Permissions</h3>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <path d='M9 12l2 2 4-4' />
              <path d='M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3' />
              <path d='M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3' />
              <path d='M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3' />
              <path d='M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3' />
            </svg>
          </div>
          <div className='p-6 pt-0'>
            <div className='text-2xl font-bold'>127</div>
            <p className='text-muted-foreground text-xs'>
              +5 updated this week
            </p>
          </div>
        </div>
        <div className='bg-card text-card-foreground rounded-xl border shadow'>
          <div className='flex flex-row items-center justify-between space-y-0 p-6 pb-2'>
            <h3 className='text-sm font-medium tracking-tight'>Menu Items</h3>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <line x1='3' x2='21' y1='6' y2='6' />
              <line x1='3' x2='21' y1='12' y2='12' />
              <line x1='3' x2='21' y1='18' y2='18' />
            </svg>
          </div>
          <div className='p-6 pt-0'>
            <div className='text-2xl font-bold'>43</div>
            <p className='text-muted-foreground text-xs'>+1 new menu added</p>
          </div>
        </div>
      </div>
    </div>
  );
}
