import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, Users, CalendarDays, DollarSign, Settings, LogOut, Menu, X, GraduationCap } from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ userAvatarUrl }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({ isPro: false, daysLeft: 0 });

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro, subscription_end_date')
          .eq('id', user.id)
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const endDate = new Date(profile.subscription_end_date);
          const now = new Date();
          const diffTime = endDate - now; // Can be negative if expired
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setSubscriptionStatus({
            isPro: profile.is_pro,
            daysLeft: diffDays > 0 ? diffDays : 0
          });
        }
      }
      setLoading(false);
    };
    getUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Grades', path: '/grades', icon: GraduationCap },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Billing', path: '/billing', icon: DollarSign },
    { label: 'Settings', path: '/settings', icon: Settings },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); // Clear user state on sign out
    navigate('/'); // Redirect to home or login page
    toggleSidebar(); // Close sidebar on sign out
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-600 dark:text-gray-300"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex flex-col
      `}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Logo />
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={toggleSidebar}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon size={20} className={`
                  ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                `} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!loading && user && (
            <div className="flex items-center gap-3 mb-4">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center font-bold text-sm text-white">
                  {getInitials(user?.user_metadata?.full_name || user?.email)}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user?.user_metadata?.full_name || user?.email}>
                  {user?.user_metadata?.full_name || 'User'}
                </p>

                {/* Subscription Status */}
                <div className="mt-1">
                  {subscriptionStatus.isPro ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      PRO PLAN
                    </span>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Trial: {subscriptionStatus.daysLeft} days left
                      </span>
                      <a
                        href="#"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={(e) => { e.preventDefault(); alert("Redirect to Stripe (Coming Soon)"); }}
                      >
                        Upgrade to Pro
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
