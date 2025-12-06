import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Link as LinkIcon, Pencil, Trash2, Search, Filter, ArrowUpDown, User } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', subject: '', hourly_rate: '', avatar_url: null });
    const [searchTerm, setSearchTerm] = useState('');

    // Subjects State
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const [customSubject, setCustomSubject] = useState('');

    // Edit State
    const [editingStudent, setEditingStudent] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    useEffect(() => {
        fetchStudents();
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name');
        if (!error) {
            setAvailableSubjects(data || []);
        }
    };

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
        setNewStudent({ name: '', email: '', subject: '', hourly_rate: '', avatar_url: null });
        setIsCustomSubject(false);
        setCustomSubject('');
        setIsModalOpen(true);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);

        // Check if subject is in availableSubjects (DB subjects)
        const inDb = availableSubjects.some(s => s.name === student.subject);

        if (inDb) {
            setNewStudent({
                name: student.name,
                email: student.email,
                subject: student.subject,
                hourly_rate: student.hourly_rate || '',
                avatar_url: student.avatar_url
            });
            setIsCustomSubject(false);
            setCustomSubject('');
        } else {
            setNewStudent({
                name: student.name,
                email: student.email,
                subject: 'Other',
                hourly_rate: student.hourly_rate || '',
                avatar_url: student.avatar_url
            });
            setIsCustomSubject(true);
            setCustomSubject(student.subject);
        }
        setIsModalOpen(true);
    };

    const handleSaveStudent = async () => {
        let finalSubject = newStudent.subject;

        if (isCustomSubject) {
            finalSubject = customSubject.trim();
            if (!finalSubject) return; // Don't save if empty custom subject

            // Auto-save new subject to DB if it doesn't exist
            const existsInDb = availableSubjects.some(s => s.name.toLowerCase() === finalSubject.toLowerCase());

            if (!existsInDb) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: newSub, error: subError } = await supabase
                            .from('subjects')
                            .insert([{ user_id: user.id, name: finalSubject }])
                            .select()
                            .single();

                        if (!subError && newSub) {
                            setAvailableSubjects(prev => [...prev, newSub]);
                        }
                    }
                } catch (err) {
                    console.error("Error auto-saving subject:", err);
                }
            }
        }

        if (!newStudent.name || !newStudent.email || !finalSubject) return;

        let error;
        if (editingStudent) {
            // Update existing student
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    name: newStudent.name,
                    email: newStudent.email,
                    subject: finalSubject,
                    hourly_rate: newStudent.hourly_rate || null,
                    avatar_url: newStudent.avatar_url
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
                        subject: finalSubject,
                        hourly_rate: newStudent.hourly_rate || null,
                        avatar_url: newStudent.avatar_url,
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
            setNewStudent({ name: '', email: '', subject: '', hourly_rate: '', avatar_url: null });
            setEditingStudent(null);
            setIsCustomSubject(false);
            setCustomSubject('');
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

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [studentToInvite, setStudentToInvite] = useState(null);

    const handleInvite = (student) => {
        setStudentToInvite(student);
        setIsInviteModalOpen(true);
    };

    const sendInviteEmail = () => {
        if (!studentToInvite) return;

        const subject = encodeURIComponent("Invitation to Student Portal");
        const body = encodeURIComponent(`Hi ${studentToInvite.name},\n\nI'd like to invite you to join the Student Portal. Please click the link below to sign up:\n\n[Link Placeholder]\n\nBest,\n[Teacher Name]`);

        window.location.href = `mailto:${studentToInvite.email}?subject=${subject}&body=${body}`;

        setIsInviteModalOpen(false);
        setStudentToInvite(null);
    };

    const handleDelete = (id) => {
        confirmDelete(id);
    };

    const setFormData = setNewStudent; // Alias for compatibility with existing code if needed
    const formData = newStudent; // Alias
    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveStudent();
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            {/* ... (Header and List remain same) ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your students and their progress.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => console.log('Filter clicked')}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Filter size={20} />
                    </button>
                    <button
                        onClick={() => console.log('Sort clicked')}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowUpDown size={20} />
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>Add Student</span>
                    </button>
                </div>
            </div>

            {/* Students List - Desktop */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hourly Rate</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {student.avatar_url ? (
                                            <img
                                                src={student.avatar_url}
                                                alt={student.name}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                {student.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.subject}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.hourly_rate}€ / hr</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => handleInvite(student)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
                                            title="Copy Invite Link"
                                        >
                                            <LinkIcon size={16} />
                                            <span>Invite</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingStudent(student);
                                                setFormData({
                                                    name: student.name,
                                                    email: student.email,
                                                    subject: student.subject,
                                                    hourly_rate: student.hourly_rate || 30,
                                                    avatar_url: student.avatar_url
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Pencil size={16} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(student.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Trash2 size={16} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {students.map((student) => (
                    <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {student.avatar_url ? (
                                    <img
                                        src={student.avatar_url}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Subject</p>
                                <p className="font-medium text-gray-900 dark:text-white">{student.subject}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Rate</p>
                                <p className="font-medium text-gray-900 dark:text-white">{student.hourly_rate}€ / hr</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => handleInvite(student)}
                                className="flex-1 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                            >
                                Invite
                            </button>
                            <button
                                onClick={() => {
                                    setEditingStudent(student);
                                    setFormData({
                                        name: student.name,
                                        email: student.email,
                                        subject: student.subject,
                                        hourly_rate: student.hourly_rate || 30,
                                        avatar_url: student.avatar_url
                                    });
                                    setIsModalOpen(true);
                                }}
                                className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(student.id)}
                                className="flex-1 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingStudent ? 'Edit Student' : 'Add New Student'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-center mb-6">
                                <AvatarUpload
                                    url={formData.avatar_url}
                                    onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
                                    size={100}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                    <div className="flex flex-col gap-2">
                                        <div className="relative">
                                            <select
                                                value={newStudent.subject}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setIsCustomSubject(true);
                                                        setNewStudent({ ...newStudent, subject: 'Other' });
                                                    } else {
                                                        setIsCustomSubject(false);
                                                        // Find the selected subject object to get its default hourly rate
                                                        const selectedSub = availableSubjects.find(s => s.name === val);
                                                        const defaultRate = selectedSub ? (selectedSub.hourly_rate || 30) : 30;

                                                        setNewStudent({
                                                            ...newStudent,
                                                            subject: val,
                                                            hourly_rate: defaultRate // Auto-inject rate
                                                        });
                                                    }
                                                }}
                                                className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2 px-4 pr-8 rounded-lg leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="" disabled>Select a subject</option>
                                                {availableSubjects.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                                <option value="Other">Other (Add new...)</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                        {isCustomSubject && (
                                            <input
                                                type="text"
                                                value={customSubject}
                                                onChange={(e) => setCustomSubject(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none animate-fade-in"
                                                placeholder="Enter new subject..."
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (€)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.hourly_rate}
                                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    {editingStudent ? 'Save Changes' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-96 text-center border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Deletion</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">Are you sure you want to delete this student?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteStudent}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && studentToInvite && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-96 text-center border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Send Invitation?</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            Do you want to send an invitation email to <strong>{studentToInvite.email}</strong>?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendInviteEmail}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
