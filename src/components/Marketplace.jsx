import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, MapPin, Mail, BookOpen, User, Star, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CityAutocomplete from './CityAutocomplete';

export default function Marketplace() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Booking State
    const [isBookingMode, setIsBookingMode] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error
    const [bookingError, setBookingError] = useState('');

    const STANDARD_SUBJECTS = ["Mathematics", "English", "Physics", "Marketing", "Management", "Law", "Technology", "Piano", "Coach Sportif"];

    useEffect(() => {
        fetchProfiles();
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setUserRole(data?.role || 'student');
        }
    };

    const fetchProfiles = async () => {
        console.log("Fetching profiles..."); // Debug 1
        try {
            setLoading(true);

            // Fetch Profiles with Subjects and Reviews
            // Simplify query to isolate the issue (Remove filters first)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*, subjects(name), reviews(rating)');

            if (profilesError) {
                console.error("Supabase Error:", profilesError); // Debug 2
                alert("Error fetching profiles: " + profilesError.message);
                throw profilesError;
            }

            console.log("Data received:", profilesData); // Debug 3

            if (!profilesData || profilesData.length === 0) {
                console.warn("No profiles found in DB!"); // Debug 4
            }

            // Manually filter locally instead of in SQL for now
            // We want to show public profiles only, but for debugging we might want to see all if needed.
            // But the requirement is to filter.
            const publicProfiles = (profilesData || []).filter(p => p.is_public === true);
            console.log("Public profiles after filter:", publicProfiles);

            // Map subjects and calculate ratings
            const profilesWithData = publicProfiles.map(profile => {
                // Subjects
                const allSubjects = [];
                if (profile.subject) allSubjects.push(profile.subject);
                if (profile.subjects) {
                    profile.subjects.forEach(s => allSubjects.push(s.name));
                }
                const uniqueSubjects = [...new Set(allSubjects)];

                // Ratings
                const reviews = profile.reviews || [];
                const reviewCount = reviews.length;
                const averageRating = reviewCount > 0
                    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1)
                    : null;

                return {
                    ...profile,
                    subjects: uniqueSubjects,
                    rating: averageRating,
                    reviewCount: reviewCount
                };
            });

            setProfiles(profilesWithData);
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

    const handleBookLesson = async () => {
        if (!bookingDate || !bookingTime) {
            setBookingError("Please select both a date and time.");
            return;
        }

        setBookingStatus('loading');
        setBookingError('');

        try {
            // Combine date and time into a timestamp
            const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();

            const { error } = await supabase
                .from('bookings')
                .insert({
                    student_id: currentUser.id,
                    teacher_id: selectedTeacher.id,
                    scheduled_at: scheduledAt,
                    status: 'pending',
                    price: 30 // Default price for now
                });

            if (error) throw error;

            setBookingStatus('success');
            setTimeout(() => {
                setContactModalOpen(false);
                setIsBookingMode(false);
                setBookingStatus('idle');
                setBookingDate('');
                setBookingTime('');
            }, 2000);
        } catch (error) {
            console.error("Booking error:", error);
            setBookingError(error.message);
            setBookingStatus('error');
        }
    };

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
                                <div
                                    key={profile.id}
                                    onClick={() => {
                                        setSelectedTeacher(profile);
                                        setContactModalOpen(true);
                                    }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
                                >
                                    <div className="p-6 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                {profile.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile.full_name}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border-2 border-blue-100 dark:border-blue-800 shrink-0 shadow-sm">
                                                        {(profile.full_name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{profile.full_name || 'Teacher'}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {profile.rating ? (
                                                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded text-xs font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
                                                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                                                <span>{profile.rating}</span>
                                                                <span className="text-gray-400 dark:text-gray-500">({profile.reviewCount})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/30">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    {profile.city && (
                                                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                            <MapPin size={14} className="mr-1" />
                                                            {profile.city}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
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

                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-6 flex-grow">
                                            {profile.bio || "No bio available."}
                                        </p>

                                        <button
                                            className="block w-full py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-center font-semibold rounded-xl transition-colors mt-auto"
                                        >
                                            View Profile
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
                                <p className="text-red-500 font-bold mt-4">(Debug: Check Console)</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Teacher Profile Modal */}
            {contactModalOpen && selectedTeacher && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-700 relative animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContactModalOpen(false);
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 bg-white dark:bg-gray-800 rounded-full p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="flex-shrink-0 text-center md:text-left">
                                    {selectedTeacher.avatar_url ? (
                                        <img
                                            src={selectedTeacher.avatar_url}
                                            alt={selectedTeacher.full_name}
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md mx-auto md:mx-0"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-3xl border-4 border-white dark:border-gray-700 shadow-md mx-auto md:mx-0">
                                            {(selectedTeacher.full_name || 'U').charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center md:text-left">{selectedTeacher.full_name}</h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                        {selectedTeacher.subjects && selectedTeacher.subjects.map((sub, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                    {selectedTeacher.city && (
                                        <div className="flex items-center justify-center md:justify-start text-gray-500 dark:text-gray-400 mt-2">
                                            <MapPin size={16} className="mr-1" />
                                            {selectedTeacher.city}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedTeacher.bio || "No biography provided."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                                    <div className="space-y-3">
                                        {selectedTeacher.public_email && selectedTeacher.show_email ? (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                                                    <Mail size={18} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Email</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedTeacher.public_email}</p>
                                                </div>
                                            </div>
                                        ) : null}

                                        {selectedTeacher.phone && selectedTeacher.show_phone ? (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Phone</p>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTeacher.phone}</p>
                                                </div>
                                            </div>
                                        ) : null}

                                        {(!selectedTeacher.public_email || !selectedTeacher.show_email) && (!selectedTeacher.phone || !selectedTeacher.show_phone) && (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 text-sm">
                                                No direct contact info shared.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
                                    <div className="rounded-xl overflow-hidden h-48 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 relative">
                                        {selectedTeacher.city ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                style={{ border: 0 }}
                                                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(selectedTeacher.city)}`}
                                                allowFullScreen
                                                title="Teacher Location"
                                                className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                            ></iframe>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                Location not available
                                            </div>
                                        )}
                                        {/* Note: Google Maps Embed requires an API Key. Using a placeholder or simple iframe if no key. 
                                            Actually, for simple city search, we can use the embed API or just a link. 
                                            Since I don't have an API key, I'll use a direct maps search link or a placeholder message 
                                            that it requires an API key, OR use OpenStreetMap which is free. 
                                            Let's use OpenStreetMap for now to ensure it works without config. */}
                                        <div className="absolute inset-0 z-10 pointer-events-none border-4 border-transparent"></div>
                                    </div>
                                    {selectedTeacher.city && (
                                        <div className="mt-2 text-right">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTeacher.city)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Open in Google Maps
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setContactModalOpen(false)}
                                className="px-6 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            {/* Conditional Booking Button */}
                            {!currentUser ? (
                                <Link to="/login" className="ml-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                                    Log in to Book
                                </Link>
                            ) : userRole === 'student' ? (
                                <button
                                    onClick={() => setIsBookingMode(true)}
                                    className="ml-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <BookOpen size={18} />
                                    Book Lesson
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal Overlay */}
            {contactModalOpen && isBookingMode && selectedTeacher && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700 relative animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Book a Lesson</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                Schedule a session with <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedTeacher.full_name}</span>.
                            </p>

                            {bookingStatus === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Your request has been sent to the teacher.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="date"
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="time"
                                                value={bookingTime}
                                                onChange={(e) => setBookingTime(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {bookingError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                            <span className="font-bold">Error:</span> {bookingError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {bookingStatus !== 'success' && (
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={() => setIsBookingMode(false)}
                                    disabled={bookingStatus === 'loading'}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBookLesson}
                                    disabled={bookingStatus === 'loading'}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {bookingStatus === 'loading' ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        'Confirm Booking'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
