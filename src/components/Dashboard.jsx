import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    const [revenueData, setRevenueData] = useState([]);

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

        // Calculate date range for the last 6 months
        const today = new Date();
        const startOfSixMonthsAgo = new Date();
        startOfSixMonthsAgo.setMonth(today.getMonth() - 5);
        startOfSixMonthsAgo.setDate(1);
        startOfSixMonthsAgo.setHours(0, 0, 0, 0);

        const endOfCurrentMonth = new Date();
        endOfCurrentMonth.setMonth(today.getMonth() + 1);
        endOfCurrentMonth.setDate(0);
        endOfCurrentMonth.setHours(23, 59, 59, 999);

        // Fetch classes for the last 6 months
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('*, students(hourly_rate)')
            .gte('date', startOfSixMonthsAgo.toISOString())
            .lte('date', endOfCurrentMonth.toISOString());

        if (classesError) {
            console.error('Error fetching classes:', classesError);
        } else {
            // Process data for the chart and current month income
            const monthlyData = {};
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Initialize last 6 months with 0
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(today.getMonth() - i);
                const key = `${monthNames[d.getMonth()]}`;
                // We want to order them chronologically later, so we might need a better key or just sort later
                // Let's use a simple array approach
            }

            // Better approach: Create an array of the last 6 months keys
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(today.getMonth() - i);
                last6Months.push({
                    name: monthNames[d.getMonth()],
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    income: 0
                });
            }

            let currentMonthTotal = 0;
            const currentMonthIndex = today.getMonth();
            const currentYear = today.getFullYear();

            classes.forEach(cls => {
                const date = new Date(cls.date);
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                const rate = cls.students?.hourly_rate || 30;

                // Update chart data
                const monthData = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
                if (monthData) {
                    monthData.income += rate;
                }

                // Update current month income
                if (monthIndex === currentMonthIndex && year === currentYear) {
                    currentMonthTotal += rate;
                }
            });

            setRevenueData(last6Months);
            setMonthlyIncome(currentMonthTotal);
        }

        // Fetch upcoming classes
        const { data: upcoming, error: upcomingError } = await supabase
            .from('classes')
            .select('*, students(name, subject)')
            .gte('date', today.toISOString()) // today is already set to start of day above? No, wait.
            // Re-initialize today for upcoming classes to be safe or reuse if correct
            // The previous 'today' was just 'new Date()'. Let's reset it to start of day for upcoming check
            .gte('date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
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
        { title: 'Next Class', value: upcomingClasses.length > 0 ? (upcomingClasses[0].time ? upcomingClasses[0].time.slice(0, 5) : '??:??') : '-', color: 'text-purple-600' },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Revenue Overview Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                tickFormatter={(value) => `${value}€`}
                            />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`${value}€`, 'Income']}
                            />
                            <Bar
                                dataKey="income"
                                fill="#3B82F6"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                                        {cls.time ? cls.time.slice(0, 5) : '??:??'}
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
