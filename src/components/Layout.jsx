import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, userAvatarUrl }) => {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar userAvatarUrl={userAvatarUrl} />
            <div className="flex-1 ml-0 md:ml-64 p-4">
                {children}
            </div>
        </div>
    );
};

export default Layout;
