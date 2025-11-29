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
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [upcomingClasses, setUpcomingClasses] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Fetch student count
        const { count, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error fetching student count:', countError);
        } else {
            setStudentCount(count || 0);
        }

        // Fetch classes for current month to calculate income
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('*, students(hourly_rate)')
            .gte('date', startOfMonth.toISOString())
            .lte('date', endOfMonth.toISOString());

        if (classesError) {
            console.error('Error fetching classes:', classesError);
        } else {
            let total = 0;
            classes.forEach(cls => {
                const rate = cls.students?.hourly_rate || 30;
                total += rate;
            });
            setMonthlyIncome(total);
        }

        // Fetch upcoming classes
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: upcoming, error: upcomingError } = await supabase
            .from('classes')
            .select('*, students(name, subject)')
            .gte('date', today.toISOString())
            .order('date', { ascending: true })
            .limit(5);

        if (upcomingError) {
            console.error('Error fetching upcoming classes:', upcomingError);
        } else {
            setUpcomingClasses(upcoming || []);
        }
    };

    const stats = [
        { title: 'Active Students', value: studentCount.toString(), color: 'text-blue-600' },
        { title: 'Income this month', value: `${monthlyIncome}€`, color: 'text-green-600' },
        { title: 'Next Class', value: upcomingClasses.length > 0 ? new Date(upcomingClasses[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-', color: 'text-purple-600' },
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
                <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Classes</h2>
                {upcomingClasses.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No upcoming classes scheduled.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingClasses.map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-gray-900 font-bold">
                                        {new Date(cls.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        <span className="mx-2">-</span>
                                        {new Date(cls.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="font-medium text-gray-900">{cls.students?.name}</span>
                                        <span className="text-gray-400 mx-2">|</span>
                                        <span className="text-sm">{cls.students?.subject}</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                    Upcoming
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
