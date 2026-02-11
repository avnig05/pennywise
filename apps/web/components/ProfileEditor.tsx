'use client';

import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '@/lib/api/profile';
import type { Profile } from '@/types/profile';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Save, Edit2, X } from 'lucide-react';

const AGE_RANGES = {
  lt_18: 'Under 18',
  '18_24': '18-24',
  '25_34': '25-34',
  '35_44': '35-44',
  '45_54': '45-54',
  '55_64': '55-64',
  '65_plus': '65+',
  unknown: 'Prefer not to say',
};

const JOB_TYPES = {
  w2: 'W-2 Employee',
  '1099': '1099 Contractor',
  unknown: 'Other/Prefer not to say',
};

const PAY_FREQUENCIES = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  'semi-monthly': 'Semi-monthly',
  monthly: 'Monthly',
  unknown: 'Prefer not to say',
};

const INCOME_RANGES = {
  lt_1500: 'Less than $1,500/month',
  '1500_2500': '$1,500 - $2,500/month',
  '2500_4000': '$2,500 - $4,000/month',
  gt_4000: 'More than $4,000/month',
  unknown: 'Prefer not to say',
};

const RENT_STATUS_OPTIONS = {
  rent: 'Renting',
  parents: 'Living with parents',
  dorm: 'Dorm/Student housing',
  other: 'Other',
  unknown: 'Prefer not to say',
};

const DEBT_STATUS_OPTIONS = {
  none: 'No debt',
  student_loans: 'Student loans',
  credit_card: 'Credit card debt',
  both: 'Both student loans and credit card debt',
};

const CREDIT_CARD_STATUS_OPTIONS = {
  no_card: "Don't have a credit card",
  have_not_used: 'Have card, never used',
  use_sometimes: 'Use occasionally',
  use_often: 'Use regularly',
};

const EMERGENCY_BUFFER_OPTIONS = {
  zero: '$0',
  lt_500: 'Less than $500',
  '500_2000': '$500 - $2,000',
  gt_2000: 'More than $2,000',
};

const PRIORITIES = {
  save: 'Building savings',
  credit: 'Building credit',
  debt: 'Paying off debt',
  unsure: 'Not sure',
};

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<Profile>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setEditedProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateProfile(editedProfile);
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-sage-500" size={32} />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadProfile} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
          <p className="text-sm text-gray-600">
            This helps us personalize your financial education
          </p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline">
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" disabled={saving}>
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Age Range */}
        <div>
          <Label htmlFor="age_range">Age Range</Label>
          {editing ? (
            <select
              id="age_range"
              value={editedProfile.age_range || 'unknown'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, age_range: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(AGE_RANGES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {AGE_RANGES[profile?.age_range || 'unknown']}
            </p>
          )}
        </div>

        {/* State */}
        <div>
          <Label htmlFor="state">State</Label>
          {editing ? (
            <Input
              id="state"
              value={editedProfile.state || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, state: e.target.value })}
              placeholder="e.g. CA, NY, TX"
              maxLength={2}
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-gray-700">{profile?.state || 'Not provided'}</p>
          )}
        </div>

        {/* Job Type */}
        <div>
          <Label htmlFor="job_type">Employment Type</Label>
          {editing ? (
            <select
              id="job_type"
              value={editedProfile.job_type || 'unknown'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, job_type: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(JOB_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">{JOB_TYPES[profile?.job_type || 'unknown']}</p>
          )}
        </div>

        {/* Pay Frequency */}
        <div>
          <Label htmlFor="pay_frequency">Pay Frequency</Label>
          {editing ? (
            <select
              id="pay_frequency"
              value={editedProfile.pay_frequency || 'unknown'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, pay_frequency: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(PAY_FREQUENCIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {PAY_FREQUENCIES[profile?.pay_frequency || 'unknown']}
            </p>
          )}
        </div>

        {/* Income Range */}
        <div>
          <Label htmlFor="net_income_range">Monthly Income</Label>
          {editing ? (
            <select
              id="net_income_range"
              value={editedProfile.net_income_range || 'unknown'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, net_income_range: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(INCOME_RANGES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {INCOME_RANGES[profile?.net_income_range || 'unknown']}
            </p>
          )}
        </div>

        {/* Rent Status */}
        <div>
          <Label htmlFor="rent_status">Housing Situation</Label>
          {editing ? (
            <select
              id="rent_status"
              value={editedProfile.rent_status || 'unknown'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, rent_status: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(RENT_STATUS_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {RENT_STATUS_OPTIONS[profile?.rent_status || 'unknown']}
            </p>
          )}
        </div>

        {/* Debt Status */}
        <div>
          <Label htmlFor="debt_status">Debt Status</Label>
          {editing ? (
            <select
              id="debt_status"
              value={editedProfile.debt_status || 'none'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, debt_status: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(DEBT_STATUS_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {DEBT_STATUS_OPTIONS[profile?.debt_status || 'none']}
            </p>
          )}
        </div>

        {/* Credit Card Status */}
        <div>
          <Label htmlFor="credit_card_status">Credit Card Usage</Label>
          {editing ? (
            <select
              id="credit_card_status"
              value={editedProfile.credit_card_status || 'no_card'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, credit_card_status: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(CREDIT_CARD_STATUS_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {CREDIT_CARD_STATUS_OPTIONS[profile?.credit_card_status || 'no_card']}
            </p>
          )}
        </div>

        {/* Emergency Buffer */}
        <div>
          <Label htmlFor="emergency_buffer_range">Emergency Fund</Label>
          {editing ? (
            <select
              id="emergency_buffer_range"
              value={editedProfile.emergency_buffer_range || 'zero'}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  emergency_buffer_range: e.target.value as any,
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(EMERGENCY_BUFFER_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">
              {EMERGENCY_BUFFER_OPTIONS[profile?.emergency_buffer_range || 'zero']}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Financial Priority</Label>
          {editing ? (
            <select
              id="priority"
              value={editedProfile.priority || 'unsure'}
              onChange={(e) =>
                setEditedProfile({ ...editedProfile, priority: e.target.value as any })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              {Object.entries(PRIORITIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-gray-700">{PRIORITIES[profile?.priority || 'unsure']}</p>
          )}
        </div>
      </div>

      {/* Interests */}
      <div>
        <Label>Financial Topics of Interest</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile?.interests && profile.interests.length > 0 ? (
            profile.interests.map((interest, i) => (
              <span
                key={i}
                className="rounded-full bg-sage-100 px-3 py-1 text-sm text-sage-700"
              >
                {interest}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No interests selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

