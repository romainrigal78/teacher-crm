import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [fullName, setFullName] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [customSubject, setCustomSubject] = useState('');
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [theme, setTheme] = useState('System');
    const [message, setMessage] = useState(null);

    const STANDARD_SUBJECTS = ["Mathematics", "English", "Physics", "Marketing", "Management", "Law", "Technology"];
    const THEMES = ["Light", "Dark", "System"];

    useEffect(() => {
        getProfile();
    }, []);

    // Immediate theme update
    useEffect(() => {
        if (theme === 'Dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'Light') {
            document.documentElement.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme]);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);

                // Fetch profile data
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFullName(data.full_name || '');
                    setAvatarUrl(data.avatar_url);
                    setBio(data.bio || '');
                    setCity(data.city || '');
                    setTheme(data.theme || 'System');

                    // Handle Subject Logic
                    if (data.subject) {
                        if (STANDARD_SUBJECTS.includes(data.subject)) {
                            setSubject(data.subject);
                            setIsCustomSubject(false);
                        } else {
                            setSubject('Other');
                            setCustomSubject(data.subject);
                            setIsCustomSubject(true);
                        }
                    }
                } else if (user.user_metadata?.full_name) {
                    // Fallback to auth metadata if no profile yet
                    setFullName(user.user_metadata.full_name);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = async (e) => {
        const newTheme = e.target.value;
        setTheme(newTheme);

        // 1. Apply immediately to DOM
        if (newTheme === 'Dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'Light') {
            document.documentElement.classList.remove('dark');
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        // 2. Save to Supabase
        if (user) {
            const { error } = await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id);
            if (error) console.error('Error saving theme:', error);
        }
    };

    const handleSubjectChange = (e) => {
        const val = e.target.value;
        if (val === 'Other') {
            setIsCustomSubject(true);
            setSubject('Other');
        } else {
            setIsCustomSubject(false);
            setSubject(val);
        }
    };

    const uploadAvatar = async (event) => {
        try {
            setUpdating(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            setMessage({ type: 'success', text: 'Avatar uploaded!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const finalSubject = isCustomSubject ? customSubject : subject;

            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                subject: finalSubject,
                bio,
                city,
                theme,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading settings...</div>;
    }

    const inputClasses = "w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none transition-all";
    const selectClasses = "w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500";
    const chevronIcon = (
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-700 dark:text-gray-200">
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your account details and public profile.</p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-2xl font-bold border-2 border-gray-200 dark:border-gray-600">
                                        {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
                                        Change Photo
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={uploadAvatar}
                                            disabled={updating}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, GIF or PNG. Max 1MB.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={inputClasses}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className={inputClasses}
                                    placeholder="Paris, France"
                                />
                            </div>
                        </div>

                        {/* Smart Subject Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teaching Subject</label>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative w-full md:w-1/2">
                                    <select
                                        value={subject}
                                        onChange={handleSubjectChange}
                                        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    >
                                        {STANDARD_SUBJECTS.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                        <option value="Other">Other (Add new...)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>

                                {isCustomSubject && (
                                    <input
                                        type="text"
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        className={`${inputClasses} md:w-1/2 animate-fade-in`}
                                        placeholder="Enter your subject..."
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows="4"
                                className={inputClasses}
                                placeholder="Tell us a bit about yourself..."
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {updating ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Appearance</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize how the application looks.</p>
                </div>
                <div className="p-6">
                    <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
                        <div className="relative">
                            <select
                                value={theme}
                                onChange={handleThemeChange}
                                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                {THEMES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
