'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdOutlineEmail, MdOutlinePerson, MdOutlineArrowBack } from 'react-icons/md';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'username'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const validateIdentifier = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Email or username is required';
    }
    if (value.trim().length < 2) {
      return 'Must be at least 2 characters';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate identifier
    const identifierError = validateIdentifier(identifier);
    if (identifierError) {
      setError(identifierError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccess(true);
      
      // Store reset link for development
      if (data.devLink) {
        setResetLink(data.devLink);
      }
      
      setIdentifier('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6 transition-colors"
          >
            <MdOutlineArrowBack className="w-4 h-4" />
            Back to Login
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl font-bold text-white">UC</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              Forgot Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Enter your email or username to receive a password reset link
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              ⚠️ Only admin users can reset passwords
            </p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
              <p className="font-medium">✅ Reset link sent!</p>
              <p className="mt-1">
                If an admin account exists with <strong>{identifier}</strong>, 
                you will receive a password reset link shortly.
              </p>
              {resetLink && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    🔗 Development link (click to reset):
                  </p>
                  <Link
                    href={resetLink}
                    className="text-blue-600 dark:text-blue-400 text-sm break-all hover:underline"
                    target="_blank"
                  >
                    {resetLink}
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {identifierType === 'email' ? (
                      <MdOutlineEmail className="w-5 h-5 text-gray-400" />
                    ) : (
                      <MdOutlinePerson className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setIdentifierType(e.target.value.includes('@') ? 'email' : 'username');
                      setError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter email or username"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {identifierType === 'email' ? '📧 Using email address' : '👤 Using username'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <button
                onClick={() => {
                  setSuccess(false);
                  setIdentifier('');
                  setResetLink('');
                }}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm"
              >
                Send another link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}