import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-vapi-secret'];
  if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const message = req.body.message;

  if (message.type === 'tool-calls') {
    const results = [];

    for (const toolCall of message.toolCallList) {
      const { name, arguments: args } = toolCall.function;
      let result = 'ok';

      if (name === 'log_call_outcome') {
        await supabase.from('calls').insert({
          phone_number: message.call?.customer?.number ?? null,
          qualified: args.qualified,
          outcome: args.outcome,
          objection_type: args.objection_type ?? null,
        });
        result = 'logged';
      }

      if (name === 'log_opt_out') {
        await supabase.from('calls').insert({
          phone_number: args.phone_number,
          outcome: 'opted_out',
          qualified: false,
        });
        result = 'opt-out recorded';
      }

      if (name === 'check_availability') {
        result = JSON.stringify(['2026-08-25T15:00:00', '2026-08-26T10:00:00']);
      }

      if (name === 'book_appointment') {
        await supabase
          .from('calls')
          .update({ booked_slot_time: args.slot_time, outcome: 'booked' })
          .eq('phone_number', args.lead_phone)
          .order('created_at', { ascending: false })
          .limit(1);
        result = 'booked';
      }

      if (name === 'transfer_to_human') {
        result = 'transfer acknowledged';
      }

      results.push({ toolCallId: toolCall.id, result });
    }

    return res.status(200).json({ results });
  }

  if (message.type === 'end-of-call-report') {
    await supabase.from('calls').insert({
      phone_number: message.call?.customer?.number ?? null,
      duration_seconds: message.durationSeconds ?? null,
      transcript_summary: message.summary ?? null,
      qualified: false,
      outcome: 'no_outcome_logged',
    });
  }

  return res.status(200).json({ received: true });
}
