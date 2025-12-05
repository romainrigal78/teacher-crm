import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const updateSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    throw new Error("No user found");
                }

                // Update profile to Pro
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        is_pro: true,
                        subscription_end_date: null // Or set to a future date if you prefer
                    })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                // Trigger confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

            } catch (err) {
                console.error("Error updating subscription:", err);
                setError("There was an issue activating your subscription. Please contact support.");
            } finally {
                setLoading(false);
            }
        };

        updateSubscription();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Thank You!
                </h1>

                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                        Your subscription has been activated successfully. You now have full access to all Pro features.
                    </p>
                )}

                <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                    Go to Dashboard
                    <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccess;
