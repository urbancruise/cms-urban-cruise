'use client';

import {
  MdOutlinePeople,
  MdOutlineSecurity,
  MdOutlineLocationCity,
  MdOutlinePerson,
  MdOutlinePublic,
} from 'react-icons/md';
import ContentCard from './urbancruise/_components/ContentCard';

export default function AdminDashboard() {
  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove admin users',
      href: '/admin/users',
      icon: MdOutlinePeople,
      color: 'blue' as const,
    },
    {
      title: 'Manage Roles',
      description: 'Configure roles and permissions',
      href: '/admin/roles',
      icon: MdOutlineSecurity,
      color: 'orange' as const,
    },
    {
      title: 'Manage Cities',
      description: 'Add or edit service locations',
      href: '/admin/cities',
      icon: MdOutlineLocationCity,
      color: 'green' as const,
    },
    {
      title: 'Urban Cruise Website',
      description: 'Manage website content',
      href: '/admin/urbancruise',
      icon: MdOutlinePublic,
      color: 'purple' as const,
    },
    {
      title: 'My Profile',
      description: 'View and edit your account',
      href: '/admin/profile',
      icon: MdOutlinePerson,
      color: 'pink' as const,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quick Actions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Jump to any admin section
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <ContentCard
            key={action.href}
            title={action.title}
            description={action.description}
            href={action.href}
            icon={action.icon}
            color={action.color}
          />
        ))}
      </div>
    </div>
  );
}