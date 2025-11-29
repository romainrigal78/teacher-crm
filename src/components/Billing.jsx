import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Billing() {
    const [billingData, setBillingData] = useState([]);

    useEffect(() => {
        fetchUnpaidClasses();
    }, []);

    const fetchUnpaidClasses = async () => {
        // Fetch classes that are not paid, including student details
        // Note: This assumes a foreign key relationship exists between classes.student_id and students.id
        const { data, error } = await supabase
            .from('classes')
            .select('*, students(name, email, subject, hourly_rate)')
            .eq('paid', false);

        if (error) {
            console.error('Error fetching unpaid classes:', error);
            return;
        }

        // Group by student
        const grouped = {};
        data.forEach(cls => {
            // Handle cases where student might be null (if relation is optional or data integrity issue)
            if (!cls.students) return;

            const studentId = cls.students.id || cls.student_id; // Fallback if students.id isn't returned directly
            // Use student name as key or create a unique key
            const key = cls.students.name;

            if (!grouped[key]) {
                grouped[key] = {
                    student: cls.students,
                    studentId: cls.student_id, // Store the ID for updates
                    classes: [],
                    totalAmount: 0
                };
            }
            grouped[key].classes.push(cls);

            const rate = cls.students.hourly_rate || 30;
            grouped[key].totalAmount += rate;
        });

        setBillingData(Object.values(grouped));
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

    const markAsPaid = async (studentId) => {
        if (!confirm('Are you sure you want to mark all classes for this student as paid?')) return;

        const { error } = await supabase
            .from('classes')
            .update({ paid: true })
            .eq('student_id', studentId)
            .eq('paid', false);

        if (error) {
            console.error('Error marking as paid:', error);
            alert('Error updating records');
        } else {
            fetchUnpaidClasses();
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing & Invoices</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Student Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Unpaid Classes</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Total Amount</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billingData.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">
                                    No unpaid classes found.
                                </td>
                            </tr>
                        ) : (
                            billingData.map((data, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="p-4 text-gray-900 border-b border-gray-100 font-medium">
                                        {data.student.name}
                                    </td>
                                    <td className="p-4 text-gray-700 border-b border-gray-100">
                                        {data.classes.length}
                                    </td>
                                    <td className="p-4 text-red-600 font-bold border-b border-gray-100">
                                        {data.totalAmount}€
                                    </td>
                                    <td className="p-4 border-b border-gray-100">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => generateInvoice(data)}
                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
                                            >
                                                Download Invoice
                                            </button>
                                            <button
                                                onClick={() => markAsPaid(data.studentId)}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                                            >
                                                Mark as Paid
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
