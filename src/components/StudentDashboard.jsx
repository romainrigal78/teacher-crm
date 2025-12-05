import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentDashboard({ session }) {
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [unpaidClasses, setUnpaidClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchStudentData();
        }
    }, [session]);

    const fetchStudentData = async () => {
        try {
            // 1. Get Student Details linked to this Auth User
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('auth_user_id', session.user.id)
                .single();

            if (studentError) throw studentError;
            setStudent(studentData);

            // 2. Get Upcoming Classes
            const today = new Date().toISOString().split('T')[0];
            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('*')
                .eq('student_id', studentData.id)
                .gte('date', today)
                .order('date', { ascending: true });

            if (classesError) throw classesError;
            setUpcomingClasses(classesData);

            // 3. Get Unpaid Classes for Invoices
            const { data: unpaidData, error: unpaidError } = await supabase
                .from('classes')
                .select('*')
                .eq('student_id', studentData.id)
                .eq('paid', false);

            if (unpaidError) throw unpaidError;
            setUnpaidClasses(unpaidData);

            // 4. Get Grades
            const { data: gradesData, error: gradesError } = await supabase
                .from('grades')
                .select('*, assessments(title, date, max_score, subject)')
                .eq('student_id', studentData.id)
                .order('created_at', { ascending: false });

            if (gradesError) throw gradesError;
            setGrades(gradesData || []);

        } catch (error) {
            console.error('Error fetching student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = () => {
        if (!student || unpaidClasses.length === 0) return;

        const doc = new jsPDF();
        const rate = student.hourly_rate || 30;
        const totalAmount = unpaidClasses.length * rate;

        doc.setFontSize(20);
        doc.text('INVOICE', 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.text(`Student: ${student.name}`, 20, 40);
        doc.text(`Email: ${student.email}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);

        const tableColumn = ["Date", "Class Title", "Price"];
        const tableRows = unpaidClasses.map(cls => [
            cls.date,
            cls.title,
            `${rate}€`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
        });

        const finalY = doc.lastAutoTable.finalY || 70;
        doc.text(`Total Amount Due: ${totalAmount}€`, 140, finalY + 20);

        doc.save(`Invoice_${student.name}.pdf`);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
    if (!student) return <div className="p-8 text-center">Student profile not found. Please contact your teacher.</div>;

    const averageScore = grades.length > 0
        ? (grades.reduce((acc, curr) => acc + (curr.score / curr.assessments.max_score), 0) / grades.length * 20).toFixed(1)
        : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">✨</span> Student Portal
                </h1>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium rounded-lg transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hello, {student.name} 👋</h1>
                        <p className="text-gray-600 dark:text-gray-400">Welcome back to your learning dashboard.</p>
                    </div>
                    {averageScore && (
                        <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-end">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Average Score</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{averageScore}<span className="text-lg text-gray-400 dark:text-gray-500 font-medium">/20</span></div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Section 1: My Schedule (Upcoming Classes) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                📅 Upcoming Classes
                            </h2>
                            {upcomingClasses.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming classes scheduled.</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingClasses.map(cls => (
                                        <div key={cls.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">{cls.title}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <span>{new Date(cls.date).toLocaleDateString()}</span>
                                                {cls.time && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">{cls.time.slice(0, 5)}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* My Payments (Moved to left column for better balance) */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                💳 Payments
                            </h2>
                            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-blue-900 dark:text-blue-300 font-medium">Total Due</span>
                                    <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                        {(unpaidClasses.length * (student.hourly_rate || 30))}€
                                    </span>
                                </div>
                                <button
                                    onClick={downloadInvoice}
                                    disabled={unpaidClasses.length === 0}
                                    className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Download Invoice
                                </button>
                            </div>

                            {/* List of Unpaid Items */}
                            {unpaidClasses.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Unpaid Classes</h3>
                                    {unpaidClasses.map(cls => (
                                        <div key={cls.id} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">{cls.title}</span>
                                                <span className="text-gray-500 dark:text-gray-500 ml-2 text-xs">({new Date(cls.date).toLocaleDateString()})</span>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {student.hourly_rate || 30}€
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: My Grades (Assignments) - Takes up 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-full">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                📝 My Assignments & Grades
                            </h2>

                            {grades.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400">No grades or assignments recorded yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {grades.map(grade => (
                                        <div key={grade.id} className="group p-5 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {grade.assessments.subject && (
                                                            <span className="px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded border border-gray-200 dark:border-gray-600 uppercase tracking-wide">
                                                                {grade.assessments.subject}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(grade.assessments.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate" title={grade.assessments.title}>
                                                        {grade.assessments.title}
                                                    </h3>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {grade.score !== null && grade.score !== undefined && grade.score !== '' ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                                {grade.score}
                                                            </span>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                                /{grade.assessments.max_score}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-lg">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {grade.feedback ? (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                                        "{grade.feedback}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                        No feedback provided.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
