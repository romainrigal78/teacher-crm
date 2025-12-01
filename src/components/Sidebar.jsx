import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    // Listen for auth changes (e.g. profile update)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Students', href: '/students' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Billing', href: '/billing' },
    { name: 'Settings', href: '/settings' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.user_metadata?.full_name || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);

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
            className={`block px-4 py-3 rounded-lg transition-colors duration-200 ${location.pathname === link.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        {!loading && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-xs text-gray-400 truncate" title={displayEmail}>
                {displayEmail}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => import('../supabaseClient').then(({ supabase }) => supabase.auth.signOut())}
          className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

