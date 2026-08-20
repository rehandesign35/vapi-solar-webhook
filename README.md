# vapi-solar-webhook

This project receives Vapi webhook events for a solar lead-qualification voice agent and logs call outcomes to Supabase.

Before it will work, set these three environment variables in Vercel's project dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPI_WEBHOOK_SECRET`
