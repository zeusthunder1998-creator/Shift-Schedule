// api/attendance.js — Clock in/out and history
import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET attendance records ───────────────────────────────────
  if (req.method === 'GET') {
    const { bizId, date, memberId } = req.query;
    let query = supabase.from('attendance').select('*').eq('business_id', bizId);
    if (date)     query = query.eq('date', date);
    if (memberId) query = query.eq('member_id', memberId);
    query = query.order('clock_in', { ascending: false }).limit(200);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ records: data || [] });
  }

  // ── POST clock in ────────────────────────────────────────────
  if (req.method === 'POST') {
    const { bizId, memberId, action, location } = req.body;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (action === 'clock_in') {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          business_id: bizId,
          member_id: memberId,
          date,
          clock_in: now.toISOString(),
          clock_in_raw: timeStr,
          location: location || null,
          clock_out: null,
          clock_out_raw: null
        }, { onConflict: 'business_id,member_id,date' })
        .select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ record: data });
    }

    if (action === 'clock_out') {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          clock_out: now.toISOString(),
          clock_out_raw: timeStr
        })
        .eq('business_id', bizId)
        .eq('member_id', memberId)
        .eq('date', date)
        .select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ record: data });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
