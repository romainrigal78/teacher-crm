import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentDashboard({ session }) {
    const [student, setStudent] = useState(null);
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello, {student.name} 👋</h1>
                <p className="text-gray-600 mb-8">Welcome to your student dashboard.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: My Schedule */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">My Schedule</h2>
                        {upcomingClasses.length === 0 ? (
                            <p className="text-gray-500">No upcoming classes scheduled.</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingClasses.map(cls => (
                                    <div key={cls.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-semibold text-gray-900">{cls.title}</div>
                                            <div className="text-sm text-gray-500">{cls.date} {cls.time ? `at ${cls.time.slice(0, 5)}` : ''}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: My Payments */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">My Payments</h2>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-blue-900 font-medium">Total Due</span>
                                <span className="text-3xl font-bold text-blue-700">
                                    {(unpaidClasses.length * (student.hourly_rate || 30))}€
                                </span>
                            </div>
                            <button
                                onClick={downloadInvoice}
                                disabled={unpaidClasses.length === 0}
                                className="w-full mt-2 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Download Invoice
                            </button>
                        </div>

                        {/* List of Unpaid Items */}
                        {unpaidClasses.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Unpaid Classes</h3>
                                {unpaidClasses.map(cls => (
                                    <div key={cls.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                                        <div className="text-sm text-gray-700">
                                            <span className="font-medium">{cls.title}</span>
                                            <span className="text-gray-500 ml-2">({cls.date})</span>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {student.hourly_rate || 30}€
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
