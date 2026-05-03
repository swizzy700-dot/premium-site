'use client';

import { useState } from 'react';

interface WaitlistFormProps {
  onSuccess?: () => void;
  variant?: 'default' | 'compact' | 'inline';
}

export function WaitlistForm({ onSuccess, variant = 'default' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    alreadyExists?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          alreadyExists: data.alreadyExists,
        });
        setEmail('');
        setName('');
        onSuccess?.();
      } else {
        setResult({
          success: false,
          message: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to join waitlist. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (result?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-green-900">
              {result.alreadyExists ? "You're already on the list!" : "You're on the waitlist!"}
            </h4>
            <p className="text-sm text-green-700 mt-1">{result.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant for inline use
  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isSubmitting ? 'Joining...' : 'Join'}
        </button>
        {result && !result.success && (
          <p className="text-xs text-red-600 w-full">{result.message}</p>
        )}
      </form>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {variant === 'default' && (
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {isSubmitting ? 'Joining...' : 'Join Early Access'}
        </button>
      </div>
      {result && !result.success && (
        <p className="text-sm text-red-600">{result.message}</p>
      )}
      <p className="text-xs text-slate-500">
        Join {Math.floor(Math.random() * 500 + 1500).toLocaleString()}+ developers waiting for early access
      </p>
    </form>
  );
}
