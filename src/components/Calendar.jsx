import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../supabaseClient';

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, title, date');

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
            setStudents(data);
        }
    };

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
        setIsModalOpen(true);
        setSelectedStudentId('');
    };

    const handleBookClass = async () => {
        if (!selectedStudentId) return;

        try {
            const student = students.find(s => s.id == selectedStudentId); // Use == to handle string/number mismatch
            if (!student) {
                console.error('Student not found for ID:', selectedStudentId);
                return;
            }

            console.log('Booking for:', student);

            const title = `${student.subject} - ${student.name}`;

            const { error } = await supabase
                .from('classes')
                .insert([{ title, date: selectedDate }]);

            if (error) throw error;

            fetchClasses();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error adding class:', error);
            alert(error.message);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen relative">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendar</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-12rem)]">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    height="100%"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek,dayGridDay'
                    }}
                    eventColor="#2563eb"
                />
            </div>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">New Class on {selectedDate}</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">-- Choose a student --</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBookClass}
                                disabled={!selectedStudentId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Book Class
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
