import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', subject: '', hourly_rate: '' });

    // Edit State
    const [editingStudent, setEditingStudent] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('*');

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            setStudents(data);
        }
    };

    const openAddModal = () => {
        setEditingStudent(null);
        setNewStudent({ name: '', email: '', subject: '', hourly_rate: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setNewStudent({
            name: student.name,
            email: student.email,
            subject: student.subject,
            hourly_rate: student.hourly_rate || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveStudent = async () => {
        if (!newStudent.name || !newStudent.email || !newStudent.subject) return;

        let error;
        if (editingStudent) {
            // Update existing student
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    name: newStudent.name,
                    email: newStudent.email,
                    subject: newStudent.subject,
                    hourly_rate: newStudent.hourly_rate || null
                })
                .eq('id', editingStudent.id);
            error = updateError;
        } else {
            // Insert new student
            const { error: insertError } = await supabase
                .from('students')
                .insert([
                    {
                        name: newStudent.name,
                        email: newStudent.email,
                        subject: newStudent.subject,
                        hourly_rate: newStudent.hourly_rate || null,
                        status: 'Active',
                        last_payment: new Date()
                    }
                ]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving student:', error);
        } else {
            fetchStudents();
            setIsModalOpen(false);
            setNewStudent({ name: '', email: '', subject: '', hourly_rate: '' });
            setEditingStudent(null);
        }
    };

    const confirmDelete = (id) => {
        setStudentToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteStudent = async () => {
        if (!studentToDelete) return;

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentToDelete);

        if (error) {
            console.error('Error deleting student:', error);
        } else {
            fetchStudents();
            setIsDeleteModalOpen(false);
            setStudentToDelete(null);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                    Add Student
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Subject</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Hourly Rate</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Last Payment</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 border-b border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="p-4 text-gray-900 border-b border-gray-100">
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-xs text-gray-500">{student.email}</div>
                                </td>
                                <td className="p-4 text-gray-700 border-b border-gray-100">{student.subject}</td>
                                <td className="p-4 text-gray-700 border-b border-gray-100">
                                    {student.hourly_rate ? `${student.hourly_rate}€` : '-'}
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700 border-b border-gray-100">{student.last_payment}</td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(student.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Student Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-96">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">
                            {editingStudent ? 'Edit Student' : 'Add New Student'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newStudent.subject}
                                    onChange={(e) => setNewStudent({ ...newStudent, subject: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Mathematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (€)</label>
                                <input
                                    type="number"
                                    value={newStudent.hourly_rate}
                                    onChange={(e) => setNewStudent({ ...newStudent, hourly_rate: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="30"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStudent}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-8">Are you sure you want to delete this student?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                NO
                            </button>
                            <button
                                onClick={handleDeleteStudent}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                YES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
