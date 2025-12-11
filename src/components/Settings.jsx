import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

import { X, Plus } from 'lucide-react';
import AvatarUpload from './AvatarUpload';
import CityAutocomplete from './CityAutocomplete';

const Settings = ({ onAvatarUpdate }) => {
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
    const [publicEmail, setPublicEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [showEmail, setShowEmail] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [message, setMessage] = useState(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [newSubjectInput, setNewSubjectInput] = useState('');
    const [editSubjectModalOpen, setEditSubjectModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    const STANDARD_SUBJECTS = ["Mathematics", "English", "Physics", "Marketing", "Management", "Law", "Technology"];

    useEffect(() => {
        getProfile();
        fetchSubjects();
    }, []);

    // ... (useEffect for theme remains same) ...

    const fetchSubjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('teacher_id', user.id)
                .order('name');
            if (error) throw error;
            setAvailableSubjects(data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleAddSubject = async () => {
        if (!newSubjectInput.trim()) return;
        try {
            const { data, error } = await supabase
                .from('subjects')
                .insert([{ teacher_id: user.id, user_id: user.id, name: newSubjectInput.trim() }])
                .select()
                .single();

            if (error) throw error;
            setAvailableSubjects([...availableSubjects, data]);
            setNewSubjectInput('');
        } catch (error) {
            console.error('Error adding subject:', error);
            setMessage({ type: 'error', text: 'Failed to add subject' });
        }
    };

    const handleDeleteSubject = async (id) => {
        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAvailableSubjects(availableSubjects.filter(s => s.id !== id));
            setEditSubjectModalOpen(false); // Close modal if open
        } catch (error) {
            console.error('Error deleting subject:', error);
            setMessage({ type: 'error', text: 'Failed to delete subject' });
        }
    };

    const handleSubjectClick = (sub) => {
        setEditingSubject({ ...sub, hourly_rate: sub.hourly_rate || 30 });
        setEditSubjectModalOpen(true);
    };

    const handleSaveSubject = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('subjects')
                .update({ name: editingSubject.name, hourly_rate: editingSubject.hourly_rate })
                .eq('id', editingSubject.id);

            if (error) throw error;

            setAvailableSubjects(availableSubjects.map(s => s.id === editingSubject.id ? editingSubject : s));
            setEditSubjectModalOpen(false);
            setMessage({ type: 'success', text: 'Subject updated successfully' });
        } catch (error) {
            console.error('Error updating subject:', error);
            setMessage({ type: 'error', text: 'Failed to update subject' });
        }
    };

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
                    setPublicEmail(data.public_email || '');
                    setPhone(data.phone || '');
                    setShowEmail(data.show_email || false);
                    setShowPhone(data.show_phone || false);
                    setIsPublic(data.is_public || false);

                    // Handle Subject Logic
                    // We combine standard and custom subjects for the check
                    const allSubjects = [...STANDARD_SUBJECTS, ...(availableSubjects.map(s => s.name))]; // Note: availableSubjects might be empty here initially due to async
                    // Actually, we should just check if it's in the dropdown list we WILL render.
                    // For now, let's keep the logic simple: if it's not "Other" and not in standard, it's custom?
                    // Wait, if I add "Biology" to subjects table, it should appear in the dropdown.
                    // So I need to wait for fetchSubjects?
                    // Let's just set the subject directly.

                    setSubject(data.subject || 'Mathematics');
                    // If data.subject is not in STANDARD or available, it might be an old custom one.
                    // But we want to move away from "Other" text input if possible, or keep it as fallback.
                    // Let's keep the existing logic for now but update the dropdown list later.

                    if (data.subject && !STANDARD_SUBJECTS.includes(data.subject)) {
                        // Check if it's in our DB subjects (we might not have fetched them yet fully, but let's assume we will)
                        // Actually, simpler: just set it. The dropdown will show it if it's in the list.
                        // If it's "Other" (custom typed), we set isCustomSubject true.
                        // But now we want "Other" to be "Add new to DB".
                        // Let's keep the "Other" logic for manual entry, but also support selection from DB.
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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword.length < 6) {
            setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setUpdating(true);
            // 1. Verify old password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                setStatusMessage({ type: 'error', text: 'Incorrect current password.' });
                setUpdating(false);
                return;
            }

            // 2. Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleSubjectChange = (e) => {
        const val = e.target.value;
        if (val === 'Other') {
            setIsCustomSubject(true);
            setSubject('Other');
            setCustomSubject('');
        } else {
            setIsCustomSubject(false);
            setSubject(val);
        }
    };

    const handleAvatarUpload = (url) => {
        setAvatarUrl(url);
        if (onAvatarUpdate) {
            onAvatarUpdate(url);
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
                public_email: publicEmail,
                phone: phone,
                show_email: showEmail,
                show_phone: showPhone,
                is_public: isPublic,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Ensure global state is updated on save as well
            if (onAvatarUpdate) {
                onAvatarUpdate(avatarUrl);
            }
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
    // ... (other classes remain same) ...

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* ... (Header and Message remain same) ... */}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your account details and public profile.</p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6 mb-6">
                            <AvatarUpload
                                url={avatarUrl}
                                onUpload={handleAvatarUpload}
                                size={100}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Click the camera icon to upload.
                                    <br />
                                    JPG, GIF or PNG. Max 1MB.
                                </p>
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
                                <CityAutocomplete
                                    value={city}
                                    onSelect={setCity}
                                    placeholder="Paris, France"
                                />
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Public Email</label>
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${showEmail ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showEmail ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Show on Marketplace</span>
                                    </label>
                                </div>
                                <input
                                    type="email"
                                    value={publicEmail}
                                    onChange={(e) => setPublicEmail(e.target.value)}
                                    className={inputClasses}
                                    placeholder="contact@example.com"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${showPhone ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showPhone ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Show on Marketplace</span>
                                    </label>
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={inputClasses}
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>

                        {/* Privacy Section */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Privacy & Visibility</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Make my Profile Public in Marketplace</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">If unchecked, you will not appear in search results.</p>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Manage Subjects Section */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">My Subjects</label>

                            <div className="flex flex-wrap mb-4">
                                {availableSubjects.map(sub => (
                                    <span
                                        key={sub.id}
                                        onClick={() => handleSubjectClick(sub)}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2 mb-2 dark:bg-blue-900/30 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        {sub.name}
                                    </span>
                                ))}
                                {availableSubjects.length === 0 && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">No custom subjects added yet.</span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubjectInput}
                                    onChange={(e) => setNewSubjectInput(e.target.value)}
                                    placeholder="Add new subject..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubject();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSubject}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
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

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Security</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your password and account security.</p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                        {statusMessage.text && (
                            <div className={`p-3 mb-4 rounded-md border ${statusMessage.type === 'error'
                                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                }`}>
                                {statusMessage.text}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClasses}
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClasses}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {updating ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>


            {/* Edit Subject Modal */}
            {
                editSubjectModalOpen && editingSubject && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Subject</h3>
                                <button
                                    onClick={() => setEditSubjectModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveSubject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        value={editingSubject.name}
                                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                        className={inputClasses}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Hourly Rate (€)</label>
                                    <input
                                        type="number"
                                        value={editingSubject.hourly_rate}
                                        onChange={(e) => setEditingSubject({ ...editingSubject, hourly_rate: parseFloat(e.target.value) })}
                                        className={inputClasses}
                                        min="0"
                                        step="0.5"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSubject(editingSubject.id)}
                                        className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Settings;
