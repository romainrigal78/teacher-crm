import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, MapPin, Mail, BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import CityAutocomplete from './CityAutocomplete';

export default function Marketplace() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const STANDARD_SUBJECTS = ["Mathematics", "English", "Physics", "Marketing", "Management", "Law", "Technology", "Piano", "Coach Sportif"];

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);

            // Fetch Profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;

            // Fetch Subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*');

            if (subjectsError) throw subjectsError;

            // Map subjects to profiles
            const profilesWithSubjects = (profilesData || []).map(profile => {
                const userSubjects = (subjectsData || []).filter(s => s.user_id === profile.id);
                // Combine legacy single subject with new subjects table
                const allSubjects = [];
                if (profile.subject) allSubjects.push(profile.subject);
                userSubjects.forEach(s => allSubjects.push(s.name));

                // Deduplicate
                const uniqueSubjects = [...new Set(allSubjects)];

                return {
                    ...profile,
                    subjects: uniqueSubjects
                };
            });

            setProfiles(profilesWithSubjects);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSubject = subjectFilter
            ? profile.subjects.some(s => s.toLowerCase().includes(subjectFilter.toLowerCase()))
            : true;

        const matchesCity = cityFilter
            ? (profile.city || '').toLowerCase().includes(cityFilter.toLowerCase())
            : true;

        return matchesSubject && matchesCity;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">T</div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">TeacherCRM</span>
                    </Link>
                    <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Search Section */}
            <div className="bg-blue-600 dark:bg-blue-900 py-16 px-4 transition-colors duration-300">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Find the perfect teacher for you</h1>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 transition-colors duration-300">
                        <div className="flex-1 relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                placeholder="Subject (e.g. Math)"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors duration-300"
                            />
                        </div>
                        <div className="flex-1 relative">
                            {/* MapPin icon is handled inside CityAutocomplete now, or we can keep it if we want consistent styling with the select box. 
                                The CityAutocomplete has its own icon. Let's use it directly but we might need to adjust styling to match the select box next to it.
                                The CityAutocomplete uses standard input styling. The select box uses specific styling.
                                Let's try to make them look similar.
                            */}
                            <CityAutocomplete
                                value={cityFilter}
                                onSelect={setCityFilter}
                                placeholder="City (e.g. Paris)"
                            />
                        </div>
                        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Search size={20} />
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading teachers...</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{filteredProfiles.length} teachers found</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProfiles.map(profile => (
                                <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                {profile.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile.full_name}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border-2 border-blue-100 dark:border-blue-800">
                                                        {(profile.full_name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{profile.full_name || 'Teacher'}</h3>
                                                    {profile.city && (
                                                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                            <MapPin size={14} className="mr-1" />
                                                            {profile.city}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                                                {profile.subjects && profile.subjects.slice(0, 3).map((sub, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                                                        {sub}
                                                    </span>
                                                ))}
                                                {profile.subjects && profile.subjects.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full">
                                                        +{profile.subjects.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-6 min-h-[60px]">
                                            {profile.bio || "No bio available."}
                                        </p>

                                        <button
                                            onClick={() => {
                                                setSelectedTeacher(profile);
                                                setContactModalOpen(true);
                                            }}
                                            className="block w-full py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-center font-semibold rounded-xl transition-colors"
                                        >
                                            Contact Teacher
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProfiles.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No teachers found</h3>
                                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search filters.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Contact Modal */}
            {contactModalOpen && selectedTeacher && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setContactModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <div className="text-center mb-6">
                            {selectedTeacher.avatar_url ? (
                                <img
                                    src={selectedTeacher.avatar_url}
                                    alt={selectedTeacher.full_name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md mx-auto mb-3"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl border-4 border-white dark:border-gray-700 shadow-md mx-auto mb-3">
                                    {(selectedTeacher.full_name || 'U').charAt(0)}
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTeacher.full_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Contact Information</p>
                        </div>

                        <div className="space-y-4">
                            {selectedTeacher.public_email && selectedTeacher.show_email ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Email</p>
                                            <p className="text-gray-900 dark:text-white font-medium break-all">{selectedTeacher.public_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`mailto:${selectedTeacher.public_email}`}
                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg text-center transition-colors"
                                        >
                                            Send Email
                                        </a>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedTeacher.public_email);
                                                alert('Email copied to clipboard!');
                                            }}
                                            className="px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {selectedTeacher.phone && selectedTeacher.show_phone ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                                            <User size={20} /> {/* Using User icon as phone fallback or import Phone */}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Phone</p>
                                            <p className="text-gray-900 dark:text-white font-medium">{selectedTeacher.phone}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${selectedTeacher.phone}`}
                                        className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg text-center transition-colors"
                                    >
                                        Call Now
                                    </a>
                                </div>
                            ) : null}

                            {(!selectedTeacher.public_email || !selectedTeacher.show_email) && (!selectedTeacher.phone || !selectedTeacher.show_phone) && (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                                    <p>This teacher has not shared their direct contact info yet.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setContactModalOpen(false)}
                                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
