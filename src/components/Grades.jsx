import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Calendar, Save, Check, Search, FileText, BookOpen, Trash2, Edit2, X } from 'lucide-react';

const Grades = () => {
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({}); // Map: studentId -> { score, feedback, status: 'saved' | 'saving' | 'error' | null }
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        max_score: 20,
        subject: ''
    });

    useEffect(() => {
        fetchAssessments();
        fetchStudents();
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedAssessment) {
            fetchGrades(selectedAssessment.id);
        }
    }, [selectedAssessment]);

    const fetchSubjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('subjects')
                .select('name')
                .eq('teacher_id', user.id)
                .order('name');

            if (error) throw error;
            setSubjects(data.map(s => s.name));
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchAssessments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setAssessments(data);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user.id)
                .order('name');

            if (error) throw error;
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchGrades = async (assessmentId) => {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('assessment_id', assessmentId);

            if (error) throw error;

            const gradesMap = {};
            data.forEach(grade => {
                gradesMap[grade.student_id] = {
                    score: grade.score,
                    feedback: grade.feedback,
                    status: 'saved'
                };
            });
            setGrades(gradesMap);
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const handleCreateOrUpdateAssessment = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (editingId) {
                const { error } = await supabase
                    .from('assessments')
                    .update({
                        title: newAssessment.title,
                        date: newAssessment.date,
                        max_score: newAssessment.max_score,
                        subject: newAssessment.subject || null
                    })
                    .eq('id', editingId);

                if (error) throw error;

                setAssessments(assessments.map(a =>
                    a.id === editingId
                        ? { ...a, ...newAssessment, subject: newAssessment.subject || null }
                        : a
                ));
                if (selectedAssessment?.id === editingId) {
                    setSelectedAssessment({ ...selectedAssessment, ...newAssessment, subject: newAssessment.subject || null });
                }
            } else {
                const { data, error } = await supabase
                    .from('assessments')
                    .insert([{
                        user_id: user.id,
                        title: newAssessment.title,
                        date: newAssessment.date,
                        max_score: newAssessment.max_score,
                        subject: newAssessment.subject || null
                    }])
                    .select();

                if (error) throw error;
                setAssessments([data[0], ...assessments]);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setNewAssessment({ title: '', date: new Date().toISOString().split('T')[0], max_score: 20, subject: '' });
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('Failed to save assessment');
        }
    };

    const handleDeleteAssessment = (e, assessmentId) => {
        e.stopPropagation();
        const assessment = assessments.find(a => a.id === assessmentId);
        setDeleteConfirmation(assessment);
    };

    const confirmDeleteAssessment = async () => {
        if (!deleteConfirmation) return;

        try {
            const { error } = await supabase
                .from('assessments')
                .delete()
                .eq('id', deleteConfirmation.id);

            if (error) throw error;

            setAssessments(assessments.filter(a => a.id !== deleteConfirmation.id));
            if (selectedAssessment?.id === deleteConfirmation.id) setSelectedAssessment(null);
            setDeleteConfirmation(null);
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('Failed to delete assessment');
        }
    };

    const handleEditClick = (e, assessment) => {
        e.stopPropagation();
        setEditingId(assessment.id);
        setNewAssessment({
            title: assessment.title,
            date: assessment.date,
            max_score: assessment.max_score,
            subject: assessment.subject || ''
        });
        setIsModalOpen(true);
    };

    const handleGradeChange = (studentId, field, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
                status: null // Reset status on change
            }
        }));
    };

    const saveGrade = async (studentId) => {
        const gradeData = grades[studentId];
        if (!gradeData) return;

        setGrades(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status: 'saving' }
        }));

        try {
            const { error } = await supabase
                .from('grades')
                .upsert({
                    assessment_id: selectedAssessment.id,
                    student_id: studentId,
                    score: gradeData.score,
                    feedback: gradeData.feedback,
                    updated_at: new Date()
                }, { onConflict: 'assessment_id, student_id' });

            if (error) throw error;

            setGrades(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], status: 'saved' }
            }));

            // Clear success message after 3 seconds
            setTimeout(() => {
                setGrades(prev => {
                    if (prev[studentId]?.status === 'saved') {
                        return {
                            ...prev,
                            [studentId]: { ...prev[studentId], status: 'saved_silent' } // Keep saved state but hide text if needed, or just keep 'saved'
                        };
                    }
                    return prev;
                });
            }, 3000);

        } catch (error) {
            console.error('Error saving grade:', error);
            setGrades(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], status: 'error' }
            }));
        }
    };

    // Filter students: Show if student matches assessment subject OR assessment has no subject
    const filteredStudents = students.filter(student => {
        if (!selectedAssessment?.subject) return true;
        return student.subject === selectedAssessment.subject;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grades & Assessments</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewAssessment({ title: '', date: new Date().toISOString().split('T')[0], max_score: 20, subject: '' });
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    New Assessment
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Left Column: Assessments List (col-span-4) */}
                <div className="lg:col-span-4 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Assignments & Exams</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {assessments.map(assessment => (
                            <div
                                key={assessment.id}
                                onClick={() => setSelectedAssessment(assessment)}
                                className={`group p-4 rounded-xl cursor-pointer transition-all border relative ${selectedAssessment?.id === assessment.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500 dark:ring-blue-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1 pr-12">
                                    <h3 className={`font-medium truncate ${selectedAssessment?.id === assessment.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                        {assessment.title}
                                    </h3>
                                </div>
                                {assessment.subject && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded uppercase tracking-wide">
                                        {assessment.subject}
                                    </span>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar size={12} />
                                    {new Date(assessment.date).toLocaleDateString()}
                                    <span className="ml-auto">Max: {assessment.max_score}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditClick(e, assessment)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteAssessment(e, assessment.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {assessments.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No assessments yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Grading Zone (col-span-8) */}
                <div className="lg:col-span-8 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {selectedAssessment ? (
                        <>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAssessment.title}</h2>
                                            {selectedAssessment.subject && (
                                                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase tracking-wide">
                                                    {selectedAssessment.subject}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedAssessment.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Check size={14} /> Max Score: {selectedAssessment.max_score}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <div className="min-w-full inline-block align-middle">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Student</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Score</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredStudents.map(student => {
                                                const grade = grades[student.id] || { score: '', feedback: '', status: null };

                                                return (
                                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                                            {student.subject && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{student.subject}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    value={grade.score}
                                                                    onChange={(e) => handleGradeChange(student.id, 'score', e.target.value)}
                                                                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                                    placeholder="-"
                                                                />
                                                                <span className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                                    /{selectedAssessment.max_score}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="text"
                                                                value={grade.feedback || ''}
                                                                onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                                placeholder="Add feedback..."
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => saveGrade(student.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                    title="Save Grade"
                                                                >
                                                                    <Save size={18} />
                                                                </button>

                                                                {grade.status === 'saved' && (
                                                                    <span className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium animate-in fade-in slide-in-from-left-2">
                                                                        <Check size={14} className="mr-1" /> Saved!
                                                                    </span>
                                                                )}
                                                                {grade.status === 'saving' && (
                                                                    <span className="flex items-center text-orange-500 text-xs font-medium">
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500 mr-2"></div> Saving...
                                                                    </span>
                                                                )}
                                                                {grade.status === 'error' && (
                                                                    <span className="text-red-500 text-xs font-medium">Error</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredStudents.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                        No students found for this subject.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <FileText size={32} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Assessment Selected</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs">Select an assignment from the list on the left to start grading.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Assessment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Assessment' : 'New Assessment'}
                        </h3>
                        <form onSubmit={handleCreateOrUpdateAssessment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newAssessment.title}
                                    onChange={e => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Midterm Exam"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (Optional)</label>
                                <select
                                    value={newAssessment.subject}
                                    onChange={e => setNewAssessment({ ...newAssessment, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">All Subjects</option>
                                    {subjects.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newAssessment.date}
                                        onChange={e => setNewAssessment({ ...newAssessment, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Score</label>
                                    <input
                                        type="number"
                                        required
                                        value={newAssessment.max_score}
                                        onChange={e => setNewAssessment({ ...newAssessment, max_score: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingId(null);
                                        setNewAssessment({ title: '', date: new Date().toISOString().split('T')[0], max_score: 20, subject: '' });
                                    }}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Assessment?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Are you sure you want to delete <strong>{deleteConfirmation.title}</strong>? All grades associated with it will be lost.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAssessment}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Grades;
