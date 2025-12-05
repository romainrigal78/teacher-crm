import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, AlertCircle } from 'lucide-react';

const Paywall = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('loading'); // 'pro', 'trial', 'expired'
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_pro, subscription_end_date')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (profile.is_pro) {
                setStatus('pro');
            } else {
                const endDate = new Date(profile.subscription_end_date);
                const now = new Date();

                if (endDate > now) {
                    setStatus('trial');
                    const diffTime = Math.abs(endDate - now);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysLeft(diffDays);
                } else {
                    setStatus('expired');
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            // Fallback to expired to be safe, or trial if you want to be generous on error
            setStatus('expired');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Your Free Trial has Expired
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        To continue managing your students and growing your business, please upgrade to Pro.
                    </p>

                    <a
                        href="https://buy.stripe.com/test_5kQ28tc1scDb5TT3MJcZa00"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 mb-4"
                    >
                        Subscribe for 29€/mo
                    </a>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Secure payment powered by Stripe. Cancel anytime.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {status === 'trial' && (
                <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium text-center flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    <span>Trial Active: {daysLeft} days left.</span>
                    <a
                        href="https://buy.stripe.com/test_5kQ28tc1scDb5TT3MJcZa00"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-100"
                    >
                        Upgrade now
                    </a>
                </div>
            )}
            {children}
        </>
    );
};

export default Paywall;
