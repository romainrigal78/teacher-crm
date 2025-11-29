import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const StatCard = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
);

const Dashboard = () => {
    const [studentCount, setStudentCount] = useState(0);

    useEffect(() => {
        fetchStudentCount();
    }, []);

    const fetchStudentCount = async () => {
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error fetching student count:', error);
        } else {
            setStudentCount(count || 0);
        }
    };

    const stats = [
        { title: 'Active Students', value: studentCount.toString(), color: 'text-blue-600' },
        { title: 'Income this month', value: `${studentCount * 20}€`, color: 'text-green-600' },
        { title: 'Next Class', value: '14:00', color: 'text-purple-600' },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-gray-500 text-center py-8">
                    No recent activity to show.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
