import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage({ onSignInClick }) {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    {/* Logo placeholder - could be an icon or text */}
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">T</div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">TeacherCRM</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/search" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                        Find a Teacher
                    </Link>
                    <button
                        onClick={onSignInClick}
                        className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                    The All-in-One CRM for <span className="text-blue-600">Independent Teachers</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Manage students, schedule classes, and automate billing. Stop using Excel and focus on teaching.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onSignInClick}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        Start for Free
                    </button>
                    {/* Optional secondary button */}
                    {/* <button className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-full transition-colors">
            Learn More
          </button> */}
                </div>
            </section>

            {/* Features Grid */}
            <section className="px-6 py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">Everything you need to run your business</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 text-2xl">
                                👥
                            </div>
                            <h3 className="text-xl font-bold mb-3">Student Tracking</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Keep detailed records of all your students, their progress, and contact information in one secure place.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6 text-2xl">
                                📅
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Calendar</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Schedule classes effortlessly. Avoid conflicts and manage your time with an intuitive drag-and-drop calendar.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 text-2xl">
                                💰
                            </div>
                            <h3 className="text-xl font-bold mb-3">One-Click Billing</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Generate professional invoices in seconds. Track payments and never miss a billable hour again.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12">Simple, Transparent Pricing</h2>
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md mx-auto relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Popular
                        </div>
                        <h3 className="text-gray-500 font-medium uppercase tracking-wide mb-4">Pro Plan</h3>
                        <div className="flex items-baseline justify-center mb-6">
                            <span className="text-5xl font-extrabold text-gray-900">29€</span>
                            <span className="text-xl text-gray-500 ml-2">/month</span>
                        </div>
                        <ul className="text-left space-y-4 mb-8 text-gray-600">
                            <li className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Unlimited Students
                            </li>
                            <li className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Advanced Calendar
                            </li>
                            <li className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Automated Invoicing
                            </li>
                            <li className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Priority Support
                            </li>
                        </ul>
                        <button
                            onClick={onSignInClick}
                            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-10 bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} TeacherCRM. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-900">Terms of Service</a>
                        <a href="#" className="hover:text-gray-900">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
