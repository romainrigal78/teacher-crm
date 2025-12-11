import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Edit2, X, Save, Shield, User, MapPin, Mail, Lock, DollarSign, Calendar, TrendingUp, Users, BookOpen, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'finance', 'classes'
    const [loading, setLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [revenue, setRevenue] = useState(0);

    // Filter/Search
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        city: '',
        role: 'student',
        email: '',
    });
    const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        console.log("Admin fetching profiles...");
        try {
            // 1. Fetch Users
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) {
                console.error("Error fetching users:", usersError);
                alert("Erreur Database: " + usersError.message);
                throw usersError;
            } else {
                console.log("Users found:", usersData?.length);
                setUsers(usersData || []);
            }

            // 2. Fetch Bookings (for Finance & Classes)
            // We need teacher and student names, so we might need joins or just fetch all profiles and map.
            // Since we have all profiles in 'usersData', we can map manually to save join complexity or RLS issues if any.
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .order('scheduled_at', { ascending: false });
            if (bookingsError) throw bookingsError;

            setBookings(bookingsData || []);

            // 3. Calculate Revenue
            // Assuming 'confirmed' or 'completed' bookings count, or all for now.
            // Let's sum up price of all non-cancelled bookings.
            const totalRevenue = (bookingsData || [])
                .filter(b => b.status !== 'cancelled')
                .reduce((acc, curr) => acc + (curr.price || 0), 0);
            setRevenue(totalRevenue);

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- User Management Logic ---
    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || '',
            city: user.city || '',
            role: user.role || 'student',
            email: user.email || '',
        });
        setUpdateStatus({ type: '', message: '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setUpdateStatus({ type: 'loading', message: 'Updating...' });

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    city: formData.city,
                    role: formData.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUpdateStatus({ type: 'success', message: 'User updated successfully!' });

            // Update local list
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));

            setTimeout(() => {
                setIsEditModalOpen(false);
                setUpdateStatus({ type: '', message: '' });
                setEditingUser(null);
            }, 1500);

        } catch (error) {
            console.error('Error updating user:', error);
            setUpdateStatus({ type: 'error', message: error.message });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // --- Helper to get user name by ID ---
    const getUserName = (id) => {
        const u = users.find(user => user.id === id);
        return u ? u.full_name : 'Unknown';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Shield className="text-blue-400" size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
                                Admin Panel
                            </h1>
                            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase mt-1">System Administration</p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                        {[
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'finance', label: 'Finance', icon: DollarSign },
                            { id: 'classes', label: 'Classes', icon: BookOpen },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Controls */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all backdrop-blur-sm"
                                    />
                                </div>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer backdrop-blur-sm"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* Table */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                                            ) : filteredUsers.length === 0 ? (
                                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold border border-white/10">
                                                                    {user.avatar_url ? (
                                                                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                                    ) : (user.full_name || 'U').charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white">{user.full_name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                                                user.role === 'teacher' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                                    'bg-green-500/20 text-green-300 border-green-500/30'
                                                                }`}>
                                                                {user.role || 'student'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-400 text-sm">{user.city || '-'}</td>
                                                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleEditClick(user)}
                                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINANCE TAB */}
                    {activeTab === 'finance' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 backdrop-blur-md">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                            <DollarSign size={24} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-green-100">Total Revenue</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white tracking-tight">€{revenue.toLocaleString()}</p>
                                    <p className="text-sm text-green-400/60 mt-2">+12% from last month</p>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                            <Activity size={24} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-200">Active Bookings</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white tracking-tight">{bookings.filter(b => b.status !== 'cancelled').length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLASSES TAB */}
                    {activeTab === 'classes' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Teacher</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-500" />
                                                        {new Date(booking.scheduled_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-white">{getUserName(booking.teacher_id)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">{getUserName(booking.student_id)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-mono text-gray-300">€{booking.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit User Modal (Glassmorphism) */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Edit2 size={20} className="text-blue-500" />
                            Edit User
                        </h3>

                        <form onSubmit={handleUpdateUser} className="space-y-5">
                            {updateStatus.message && (
                                <div className={`p-3 rounded-lg text-sm border ${updateStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    updateStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {updateStatus.message}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="student" className="bg-gray-900">Student</option>
                                    <option value="teacher" className="bg-gray-900">Teacher</option>
                                    <option value="admin" className="bg-gray-900">Admin</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateStatus.type === 'loading'}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    {updateStatus.type === 'loading' ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
