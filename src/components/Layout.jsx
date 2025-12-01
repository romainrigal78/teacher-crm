import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64 p-4">
                {children}
            </div>
        </div>
    );
};

export default Layout;
