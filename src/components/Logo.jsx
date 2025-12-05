import React from 'react';
import { GraduationCap } from 'lucide-react';

const Logo = ({ className = '' }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <GraduationCap size={32} className="text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">TeacherCRM</span>
        </div>
    );
};

export default Logo;
