// api/businesses.js — Thunder: CRUD businesses + members
import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method } = req;
  const { action } = req.query;

  // ── GET all businesses ───────────────────────────────────────
  if (method === 'GET' && !action) {
    const { data, error } = await supabase
      .from('businesses')
      .select(`id, name, code, created_at,
               members(id, name, username, role, is_admin, shift, expected_hours, color, bg)`)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ businesses: data });
  }

  // ── POST create business ─────────────────────────────────────
  if (method === 'POST' && action === 'create') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const code = 'BIZ-' + Math.random().toString(36).toUpperCase().slice(2, 6);
    const { data, error } = await supabase
      .from('businesses')
      .insert({ name: name.trim(), code })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ business: data });
  }

  // ── DELETE business ───────────────────────────────────────────
  if (method === 'DELETE' && action === 'delete') {
    const { bizId } = req.body;
    const { error } = await supabase.from('businesses').delete().eq('id', bizId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── POST add member ───────────────────────────────────────────
  if (method === 'POST' && action === 'add_member') {
    const { bizId, name, username, role, password, shift, expectedHours } = req.body;

    const colors = [
      { color: '#6c8cff', bg: 'rgba(108,140,255,0.12)' },
      { color: '#ff6c6c', bg: 'rgba(255,108,108,0.08)' },
      { color: '#4dffd2', bg: 'rgba(77,255,210,0.12)'  },
      { color: '#ffb84d', bg: 'rgba(255,184,77,0.12)'  },
      { color: '#c39aff', bg: 'rgba(195,154,255,0.12)' },
      { color: '#ff9e6c', bg: 'rgba(255,158,108,0.12)' },
    ];

    const { data: existing } = await supabase
      .from('members').select('id').eq('business_id', bizId);
    const palette = colors[(existing?.length || 0) % colors.length];

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        business_id: bizId,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        role, is_admin: role === 'subadmin',
        shift: shift || 'Varies',
        expected_hours: expectedHours || 48,
        ...palette
      })
      .select().single();

    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('passwords').insert({ member_id: member.id, password });
    return res.status(200).json({ member });
  }

  // ── PUT update member ─────────────────────────────────────────
  if (method === 'PUT' && action === 'update_member') {
    const { memberId, shift, expectedHours, password, name, username } = req.body;
    const updateData = {};
    if (shift !== undefined) updateData.shift = shift;
    if (expectedHours !== undefined) updateData.expected_hours = expectedHours;
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (Object.keys(updateData).length > 0) {
      await supabase.from('members').update(updateData).eq('id', memberId);
    }
    if (password) {
      await supabase.from('passwords')
        .upsert({ member_id: memberId, password }, { onConflict: 'member_id' });
    }
    return res.status(200).json({ ok: true });
  }

  // ── POST update business name ──────────────────────────────
  if (method === 'POST' && action === 'update_name') {
    const { bizId, name } = req.body;
    await supabase.from('businesses').update({ name }).eq('id', bizId);
    return res.status(200).json({ ok: true });
  }

  // ── DELETE member ─────────────────────────────────────────────
  if (method === 'DELETE' && action === 'remove_member') {
    const { memberId } = req.body;
    await supabase.from('members').delete().eq('id', memberId);
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ error: 'Unknown action' });
}
