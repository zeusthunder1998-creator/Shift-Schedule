// api/schedule.js — Read / write weekly schedule
import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET schedule for a week ──────────────────────────────────
  if (req.method === 'GET') {
    const { bizId, weekStart } = req.query;
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('business_id', bizId)
      .eq('week_start', weekStart);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ schedule: data || [] });
  }

  // ── POST save full schedule ──────────────────────────────────
  if (req.method === 'POST') {
    const { bizId, weekStart, scheduleData } = req.body;
    // scheduleData: array of {employeeIdx, dayIdx, shiftLabel, shiftStart, shiftEnd}

    // Delete existing for this week and reinsert
    await supabase.from('schedule')
      .delete()
      .eq('business_id', bizId)
      .eq('week_start', weekStart);

    const rows = scheduleData
      .filter(s => s.shiftLabel)
      .map(s => ({
        business_id: bizId,
        week_start: weekStart,
        employee_idx: s.employeeIdx,
        day_idx: s.dayIdx,
        shift_label: s.shiftLabel,
        shift_start: s.shiftStart || null,
        shift_end: s.shiftEnd || null,
        updated_at: new Date().toISOString()
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from('schedule').insert(rows);
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
