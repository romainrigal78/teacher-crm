import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
);

const Dashboard = () => {
    const [studentCount, setStudentCount] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [pendingIncome, setPendingIncome] = useState(0);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [revenueData, setRevenueData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // ... (existing fetch logic remains same) ...
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
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

            let currentMonthEarned = 0;
            let currentMonthPending = 0;
            const currentMonthIndex = today.getMonth();
            const currentYear = today.getFullYear();

            classes.forEach(cls => {
                const date = new Date(cls.date);
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                const rate = cls.students?.hourly_rate || 30;

                const monthData = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
                if (monthData && cls.paid) {
                    monthData.income += rate;
                }

                // Update current month income logic
                if (monthIndex === currentMonthIndex && year === currentYear) {
                    if (cls.paid) {
                        currentMonthEarned += rate;
                    } else {
                        currentMonthPending += rate;
                    }
                }
            });

            setRevenueData(last6Months);
            setMonthlyIncome(currentMonthEarned);
            setPendingIncome(currentMonthPending);
        }

        // Fetch upcoming classes
        const { data: upcoming, error: upcomingError } = await supabase
            .from('classes')
            .select('*, students(name, subject)')
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
        { title: 'Active Students', value: studentCount.toString(), color: 'text-blue-600 dark:text-blue-400' },
        {
            title: 'Income this month',
            value: (
                <div>
                    <span className="text-green-600 dark:text-green-400">{monthlyIncome}€</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-normal ml-2">(+ {pendingIncome}€ pending)</span>
                </div>
            ),
            color: 'text-green-600 dark:text-green-400'
        },
        { title: 'Next Class', value: upcomingClasses.length > 0 ? (upcomingClasses[0].time ? upcomingClasses[0].time.slice(0, 5) : '??:??') : '-', color: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Overview</h2>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
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
                                cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#374151' }}
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

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Classes</h2>
                {upcomingClasses.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No upcoming classes scheduled.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingClasses.map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-gray-900 dark:text-white font-bold">
                                        {new Date(cls.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        <span className="mx-2">-</span>
                                        {cls.time ? cls.time.slice(0, 5) : '??:??'}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-300">
                                        <span className="font-medium text-gray-900 dark:text-white">{cls.students?.name}</span>
                                        <span className="text-gray-400 mx-2">|</span>
                                        <span className="text-sm">{cls.students?.subject}</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
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
