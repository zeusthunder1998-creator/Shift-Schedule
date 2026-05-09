// api/data.js — Leave requests, reset requests, notifications, settings, shift swaps
import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { table, action } = req.query;

  // ── GET ───────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { bizId } = req.query;

    if (table === 'leave_requests') {
      let q = supabase.from('leave_requests')
        .select('*').eq('business_id', bizId).order('created_at', { ascending: false });
      if (req.query.since) q = q.gt('created_at', req.query.since);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (table === 'reset_requests') {
      const { data, error } = await supabase.from('reset_requests')
        .select('*').eq('business_id', bizId).order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (table === 'notifications') {
      let q = supabase.from('notifications')
        .select('*').eq('business_id', bizId)
        .order('created_at', { ascending: false });
      if (req.query.since) q = q.gt('created_at', req.query.since);
      else q = q.limit(50);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (table === 'shift_swaps') {
      const { data, error } = await supabase.from('shift_swaps')
        .select('*').eq('business_id', bizId).order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (table === 'settings') {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) return res.status(500).json({ error: error.message });
      const settings = {};
      (data || []).forEach(row => { settings[row.key] = row.value; });
      return res.status(200).json({ settings });
    }
  }

  // ── POST ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body;

    if (action === 'leave_request') {
      const { data, error } = await supabase.from('leave_requests')
        .insert({
          business_id: body.bizId, member_id: body.memberId,
          member_name: body.memberName, type: body.type || 'personal',
          date: body.date, reason: body.reason, status: 'pending'
        }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (action === 'reset_request') {
      const { data, error } = await supabase.from('reset_requests')
        .insert({
          business_id: body.bizId, member_name: body.memberName,
          reason: body.reason, status: 'pending',
          is_manager_request: body.isManagerRequest || false
        }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (action === 'notification') {
      const { data, error } = await supabase.from('notifications')
        .insert({
          business_id: body.bizId, recipient: body.recipient || 'all',
          sent_by: body.sentBy, message: body.message, type: body.type || 'info'
        }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (action === 'shift_swap') {
      const { data, error } = await supabase.from('shift_swaps')
        .insert({
          business_id: body.bizId, requester: body.requester,
          target: body.target, date: body.date,
          reason: body.reason, status: 'pending'
        }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    if (action === 'save_setting') {
      const { key, value } = body;
      const { error } = await supabase.from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── PUT (update status) ───────────────────────────────────────
  if (req.method === 'PUT') {
    const { id, status, newPassword } = req.body;

    if (table === 'leave_requests') {
      await supabase.from('leave_requests').update({ status }).eq('id', id);
      return res.status(200).json({ ok: true });
    }

    if (table === 'reset_requests') {
      await supabase.from('reset_requests').update({ status }).eq('id', id);
      if (newPassword) {
        // Find the member by name and update password
        const { data: req_data } = await supabase.from('reset_requests')
          .select('member_name, business_id').eq('id', id).single();
        if (req_data) {
          const { data: member } = await supabase.from('members')
            .select('id').eq('business_id', req_data.business_id)
            .ilike('name', req_data.member_name).single();
          if (member) {
            await supabase.from('passwords')
              .upsert({ member_id: member.id, password: newPassword }, { onConflict: 'member_id' });
          }
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (table === 'shift_swaps') {
      await supabase.from('shift_swaps').update({ status }).eq('id', id);
      return res.status(200).json({ ok: true });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { bizId } = req.body;
    if (table && bizId) {
      await supabase.from(table).delete().eq('business_id', bizId);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(404).json({ error: 'Unknown action' });
}
