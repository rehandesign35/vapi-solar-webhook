import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fakeCalls = [
  {
    phone_number: '+15550100001',
    qualified: true,
    outcome: 'booked',
    objection_type: null,
    duration_seconds: 184,
    transcript_summary: '[FAKE TEST] Qualified lead booked successfully',
    booked_slot_time: '2026-09-08T15:00:00.000Z',
  },
  {
    phone_number: '+15550100002',
    qualified: true,
    outcome: 'booked',
    objection_type: 'price',
    duration_seconds: 247,
    transcript_summary: '[FAKE TEST] Price objection handled, then booked',
    booked_slot_time: '2026-09-09T10:00:00.000Z',
  },
  {
    phone_number: '+15550100003',
    qualified: false,
    outcome: 'opted_out',
    objection_type: null,
    duration_seconds: 18,
    transcript_summary: '[FAKE TEST] Lead said stop calling; call ended immediately',
  },
  {
    phone_number: '+15550100004',
    qualified: false,
    outcome: 'escalated',
    objection_type: null,
    duration_seconds: 96,
    transcript_summary: '[FAKE TEST] Low-confidence answer escalated to a human',
  },
];

const { data, error } = await supabase
  .from('calls')
  .insert(fakeCalls)
  .select('id, phone_number, outcome, duration_seconds, objection_type');

if (error) {
  throw new Error(`Failed to seed fake calls: ${error.message}`);
}

console.table(data);