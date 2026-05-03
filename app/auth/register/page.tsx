/**
 * Register Page
 * User registration - redirects to login since API was removed
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to login after short delay
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">WS</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Registration Closed</h1>
        <p className="text-slate-600 mb-6">
          New registrations are currently disabled during beta.
          Redirecting to login...
        </p>
        <Link 
          href="/auth/login" 
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go to Sign In →
        </Link>
      </div>
    </div>
  );
}
