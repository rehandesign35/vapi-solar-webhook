import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public, read-only, AGGREGATES ONLY.
// Never return phone_number or transcript_summary here — this endpoint
// has no auth, anyone can hit it once it's deployed.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabase
    .from('calls')
    .select('qualified, outcome, objection_type, duration_seconds');

  if (error) {
    return res.status(500).json({ error: 'failed to load metrics' });
  }

  const total = data.length;
  const qualifiedCount = data.filter((r) => r.qualified === true).length;
  const bookedCount = data.filter((r) => r.outcome === 'booked').length;

  const durations = data
    .map((r) => r.duration_seconds)
    .filter((d) => typeof d === 'number' && d > 0);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const outcomeBreakdown = {};
  data.forEach((r) => {
    const key = r.outcome || 'unknown';
    outcomeBreakdown[key] = (outcomeBreakdown[key] || 0) + 1;
  });
     if (error) {
    console.error('Supabase query error:', error);
    return res.status(500).json({ error: error.message || 'failed to load metrics' });
  }
  const objectionBreakdown = {};
  data.forEach((r) => {
    if (r.objection_type) {
      objectionBreakdown[r.objection_type] = (objectionBreakdown[r.objection_type] || 0) + 1;
    }
  });

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
  return res.status(200).json({
    total_calls: total,
    qualified_rate: total ? qualifiedCount / total : 0,
    booking_rate: total ? bookedCount / total : 0,
    avg_duration_seconds: avgDuration,
    outcome_breakdown: outcomeBreakdown,
    objection_breakdown: objectionBreakdown,
    generated_at: new Date().toISOString(),
  });
}
