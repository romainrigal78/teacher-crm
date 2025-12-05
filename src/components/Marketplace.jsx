import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, MapPin, Mail, BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Marketplace() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    const STANDARD_SUBJECTS = ["Mathematics", "English", "Physics", "Marketing", "Management", "Law", "Technology", "Piano", "Coach Sportif"];

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSubject = subjectFilter ? profile.subject === subjectFilter : true;
        const matchesCity = cityFilter ? (profile.city || '').toLowerCase().includes(cityFilter.toLowerCase()) : true;
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
                            <select
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-colors duration-300"
                            >
                                <option value="">All Subjects</option>
                                {STANDARD_SUBJECTS.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="City (e.g. Paris)"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors duration-300"
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
                                            {profile.subject && (
                                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                                                    {profile.subject}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-6 min-h-[60px]">
                                            {profile.bio || "No bio available."}
                                        </p>

                                        <a
                                            href={`mailto:${profile.email || ''}`}
                                            onClick={(e) => {
                                                if (!profile.email) {
                                                    e.preventDefault();
                                                    alert("Contact info not public.");
                                                }
                                            }}
                                            className="block w-full py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-center font-semibold rounded-xl transition-colors"
                                        >
                                            Contact Teacher
                                        </a>
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
        </div>
    );
}
