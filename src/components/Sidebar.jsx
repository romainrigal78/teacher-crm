import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Students', href: '/students' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Billing', href: '/billing' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-blue-500">CRM</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
          >
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            JD
          </div>
          <div>
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">Teacher</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

