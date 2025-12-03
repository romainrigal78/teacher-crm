import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

import './Calendar.css';

const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return startTime;
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + parseInt(durationMinutes));
    return date.toTimeString().slice(0, 5); // Returns HH:MM
};

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    // Removed unused state: selectedStudentId, selectedTime
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [classToDeleteId, setClassToDeleteId] = useState(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [newClass, setNewClass] = useState({ studentId: '', date: '', time: '09:00', duration: 60 });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleBookClass();
    };

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, title, date, time');

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            setEvents(data);
        }
    };

    const fetchStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('id, name, subject')
            .eq('status', 'Active');

        if (error) {
            console.error('Error fetching students:', error);
        } else {
            console.log('Fetched students for Calendar:', data);
            setStudents(data);
        }
    };

    const handleDateClick = (arg) => {
        const clickedDate = new Date(arg.dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate < today) {
            setIsWarningModalOpen(true);
            return;
        }

        setSelectedDate(arg.dateStr);
        setNewClass({ studentId: '', date: arg.dateStr, time: '09:00', duration: 60 });
        setIsModalOpen(true);
    };

    const handleEventClick = (info) => {
        setClassToDeleteId(info.event.id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteClass = async () => {
        if (!classToDeleteId) return;

        try {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classToDeleteId);

            if (error) throw error;

            fetchClasses();
            setIsDeleteModalOpen(false);
            setClassToDeleteId(null);
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Failed to delete class');
        }
    };

    const handleBookClass = async () => {
        // Validation
        if (!newClass.studentId || !newClass.date || !newClass.time) {
            alert("Please fill all fields");
            return;
        }

        try {
            // Check for conflicts
            const { data: existingClasses, error: fetchError } = await supabase
                .from('classes')
                .select('id, time, duration')
                .eq('date', newClass.date);

            if (fetchError) throw fetchError;

            const newClassStartTime = newClass.time;
            const newClassEndTime = calculateEndTime(newClass.time, newClass.duration);

            const hasConflict = existingClasses.some(cls => {
                // Skip checking conflict with itself if editing
                if (editingClass && cls.id === editingClass.id) return false;

                if (!cls.time || !cls.duration) return false;

                const existingClassStartTime = cls.time;
                const existingClassEndTime = calculateEndTime(cls.time, cls.duration);

                // Check for overlap
                return (
                    (newClassStartTime < existingClassEndTime && newClassEndTime > existingClassStartTime) &&
                    (existingClassStartTime < newClassEndTime && existingClassEndTime > newClassStartTime)
                );
            });

            if (hasConflict) {
                setIsConflictModalOpen(true);
                return;
            }

            const student = students.find(s => s.id == newClass.studentId);
            if (!student) {
                console.error('Student not found for ID:', newClass.studentId);
                return;
            }

            const title = `${newClass.time} - ${student.subject} - ${student.name}`;

            const payload = {
                title,
                date: newClass.date,
                student_id: newClass.studentId,
                time: newClass.time,
                duration: newClass.duration,
            };

            let error;
            if (editingClass) {
                // Update existing class
                const { error: updateError } = await supabase
                    .from('classes')
                    .update(payload)
                    .eq('id', editingClass.id);
                error = updateError;
            } else {
                // Insert new class
                const { error: insertError } = await supabase
                    .from('classes')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            fetchClasses();
            setIsModalOpen(false);
            setEditingClass(null);
            setNewClass({ studentId: '', date: '', time: '09:00', duration: 60 }); // Reset form
        } catch (error) {
            console.error('Error scheduling class:', error);
            alert('Failed to schedule class: ' + error.message);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your schedule and classes.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingClass(null);
                        setSelectedDate(null); // Clear selectedDate to enable date selection
                        setNewClass({ studentId: '', date: '', time: '09:00', duration: 60 });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Class</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)]">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    dateClick={handleDateClick} // Kept dateClick
                    eventClick={handleEventClick}
                    height="100%" // Changed to 100% to fill parent div
                    eventContent={(eventInfo) => (
                        <div className="flex flex-col overflow-hidden">
                            <div className="font-semibold truncate">{eventInfo.event.title}</div>
                            <div className="text-xs opacity-90 truncate">{eventInfo.timeText}</div>
                        </div>
                    )}
                    eventColor="#2563eb" // Kept eventColor
                />
            </div>

            {/* Modal (for booking/editing) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingClass ? 'Edit Class' : 'Schedule Class'}
                            </h2>
                            {editingClass && (
                                <button
                                    onClick={() => handleDeleteClass(editingClass.id)}
                                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Class"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Date Selection: Badge if Fixed, Input if Selectable */}
                            {selectedDate ? (
                                <div className="flex justify-center mb-4">
                                    <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                                        Booking for: {selectedDate}
                                    </span>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newClass.date}
                                        onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* Student Select */}
                            <div className="relative mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={newClass.studentId}
                                        onChange={(e) => setNewClass({ ...newClass, studentId: e.target.value })}
                                        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select a student</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.name} ({student.subject})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Time Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newClass.time}
                                        onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Duration Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                                    <div className="relative">
                                        <select
                                            value={newClass.duration}
                                            onChange={(e) => setNewClass({ ...newClass, duration: parseInt(e.target.value) })}
                                            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg leading-tight focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value={30}>30 min</option>
                                            <option value={45}>45 min</option>
                                            <option value={60}>1h</option>
                                            <option value={90}>1h 30m</option>
                                            <option value={120}>2h</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                            <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
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
                                    {editingClass ? 'Save Changes' : 'Schedule Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Warning Modal (for past dates) */}
            {isWarningModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-96 text-center border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Warning</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">You cannot book a class in the past.</p>
                        <button
                            onClick={() => setIsWarningModalOpen(false)}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-96 text-center border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Class</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">Are you sure you want to delete this class?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClass}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Modal */}
            {isConflictModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-96 text-center border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Time Slot Unavailable</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">You already have a class scheduled at this time. Please choose another slot.</p>
                        <button
                            onClick={() => setIsConflictModalOpen(false)}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
