import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Billing() {
    const [pendingItems, setPendingItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [studentToPay, setStudentToPay] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        // Fetch ALL classes
        const { data, error } = await supabase
            .from('classes')
            .select('*, students(name, email, subject, hourly_rate)');

        if (error) {
            console.error('Error fetching classes:', error);
            return;
        }

        // Group by student and status
        const pendingGrouped = {};
        const historyGrouped = {};

        data.forEach(cls => {
            if (!cls.students) return;

            const key = cls.students.name;
            const targetGroup = cls.paid ? historyGrouped : pendingGrouped;

            if (!targetGroup[key]) {
                targetGroup[key] = {
                    student: cls.students,
                    studentId: cls.student_id,
                    classes: [],
                    totalAmount: 0
                };
            }
            targetGroup[key].classes.push(cls);

            const rate = cls.students.hourly_rate || 30;
            targetGroup[key].totalAmount += rate;
        });

        setPendingItems(Object.values(pendingGrouped));
        setHistoryItems(Object.values(historyGrouped));
    };

    const generateInvoice = (data) => {
        try {
            const doc = new jsPDF();
            const rate = data.student.hourly_rate || 30;

            // Header
            doc.setFontSize(20);
            doc.text('INVOICE', 105, 20, null, null, 'center');

            doc.setFontSize(12);
            doc.text(`Student: ${data.student.name}`, 20, 40);
            doc.text(`Email: ${data.student.email}`, 20, 50);
            doc.text(`Subject: ${data.student.subject}`, 20, 60);
            doc.text(`Hourly Rate: ${rate}€`, 20, 70);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);

            // Table
            const tableColumn = ["Date", "Class Title", "Price"];
            const tableRows = [];

            data.classes.forEach(cls => {
                const classData = [
                    cls.date,
                    cls.title,
                    `${rate}€`
                ];
                tableRows.push(classData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 80,
            });

            // Total
            const finalY = doc.lastAutoTable.finalY || 80;
            doc.text(`Total Amount Due: ${data.totalAmount}€`, 140, finalY + 20);

            // Save
            doc.save(`Invoice_${data.student.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Failed to generate invoice. Please try again.');
        }
    };

    const handleMarkAsPaidClick = (data) => {
        setStudentToPay(data);
        setIsPayModalOpen(true);
    };

    const confirmMarkAsPaid = async () => {
        if (!studentToPay) return;

        const { error } = await supabase
            .from('classes')
            .update({ paid: true })
            .eq('student_id', studentToPay.studentId)
            .eq('paid', false);

        if (error) {
            console.error('Error marking as paid:', error);
            alert('Error updating records');
        } else {
            fetchClasses();
            setIsPayModalOpen(false);
            setStudentToPay(null);
        }
    };

    const handleMarkAsUnpaid = async (data) => {
        // Mark all classes in this group as unpaid
        // We need to target specific classes, but for now we are grouping by student/paid status.
        // The 'data' object contains 'classes' array which has the IDs.
        const classIds = data.classes.map(c => c.id);

        const { error } = await supabase
            .from('classes')
            .update({ paid: false })
            .in('id', classIds);

        if (error) {
            console.error('Error marking as unpaid:', error);
            alert('Error updating records');
        } else {
            fetchClasses();
        }
    };

    const sendEmail = (data) => {
        const subject = encodeURIComponent('Invoice for unpaid classes');
        const body = encodeURIComponent(`Hi ${data.student.name},\n\nPlease find attached the invoice for your unpaid classes.\nTotal due: ${data.totalAmount}€.\n\nBest regards,`);
        window.location.href = `mailto:${data.student.email}?subject=${subject}&body=${body}`;
    };

    const currentItems = activeTab === 'pending' ? pendingItems : historyItems;
    const totalAmount = currentItems.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Billing & Invoices</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors relative ${activeTab === 'pending'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Pending Payments
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors relative ${activeTab === 'history'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Payment History
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 max-w-sm">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {activeTab === 'pending' ? 'Total Pending' : 'Total Earned'}
                </h3>
                <p className={`text-3xl font-bold mt-2 ${activeTab === 'pending' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {totalAmount}€
                </p>
            </div>

            {/* VIEW 1: DESKTOP TABLE (Hidden on Mobile) */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classes</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    {activeTab === 'pending' ? 'No unpaid classes found.' : 'No payment history found.'}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((data, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                        {data.student.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {data.classes.length}
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${activeTab === 'pending' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {data.totalAmount}€
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => generateInvoice(data)}
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium transition-colors"
                                            >
                                                Download Invoice
                                            </button>

                                            {activeTab === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => sendEmail(data)}
                                                        className="px-3 py-1 border border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-sm font-medium transition-colors"
                                                    >
                                                        Send Email
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkAsPaidClick(data)}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                                    >
                                                        Mark as Paid
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleMarkAsUnpaid(data)}
                                                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded text-sm font-medium transition-colors"
                                                >
                                                    Mark as Unpaid
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* VIEW 2: MOBILE CARDS (Visible ONLY on Mobile) */}
            <div className="md:hidden flex flex-col gap-4">
                {currentItems.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        {activeTab === 'pending' ? 'No unpaid classes found.' : 'No payment history found.'}
                    </div>
                ) : (
                    currentItems.map((data, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{data.student.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{data.classes.length} Classes</p>
                                </div>
                                <div className={`text-xl font-bold ${activeTab === 'pending' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {data.totalAmount}€
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => generateInvoice(data)}
                                    className="w-full py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Download Invoice
                                </button>

                                {activeTab === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => sendEmail(data)}
                                            className="w-full py-2 border border-green-600 text-green-600 dark:text-green-400 font-medium rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                        >
                                            Send Email
                                        </button>
                                        <button
                                            onClick={() => handleMarkAsPaidClick(data)}
                                            className="w-full py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors"
                                        >
                                            Mark as Paid
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleMarkAsUnpaid(data)}
                                        className="w-full py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                    >
                                        Mark as Unpaid
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Payment Confirmation Modal */}
            {isPayModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Payment</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Mark all unpaid classes for <span className="font-semibold text-gray-900 dark:text-white">{studentToPay?.student.name}</span> as paid?
                            <br />
                            <span className="text-sm text-red-500 dark:text-red-400 mt-2 block">This action cannot be undone.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsPayModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmMarkAsPaid}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
