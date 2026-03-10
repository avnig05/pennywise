'use client';

import { useEffect, useState } from 'react';
import ProfileEditor from '@/components/ProfileEditor';
import { UserRound, Mail, Calendar } from "lucide-react";
import { getSupabase } from '@/lib/supabaseClient';
import { logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email || '');
        if (data.user.created_at) {
          const date = new Date(data.user.created_at);
          setCreatedAt(date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-4xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Account Information */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail size={20} className="text-sage-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userEmail || 'Loading...'}</p>
              </div>
            </div>
            {createdAt && (
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar size={20} className="text-sage-500" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{createdAt}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Editor */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ProfileEditor />
        </div>

        {/* Danger Zone */}
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
          <p className="mt-2 text-sm text-red-600">
            Once you log out, you'll need to sign in again to access your account.
          </p>
          <Button
            onClick={() => logout()}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Log Out
          </Button>
        </div>
      </section>
    </main>
  );
}
