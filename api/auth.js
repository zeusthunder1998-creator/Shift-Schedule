const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'shift_schedule_salt_2026')
    .digest('hex');
}

function checkPassword(input, stored) {
  // Support both plain text (legacy) and hashed
  if (stored === input) return true; // legacy plain text
  if (stored === hashPassword(input)) return true; // hashed
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body     = req.body || {};
  var username = String(body.username || '').trim().toLowerCase();
  var password = String(body.password || '').trim();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username === 'thunder') {
    var r1 = await sb.from('members')
      .select('id, name, username, role, is_admin')
      .eq('username', 'thunder')
      .is('business_id', null)
      .maybeSingle();

    if (!r1.data) {
      return res.status(401).json({ error: 'Thunder account not found. Please run the SQL schema.' });
    }

    var tid      = r1.data.id;
    var tname    = r1.data.name;
    var tuname   = r1.data.username;

    var r2 = await sb.from('passwords')
      .select('password')
      .eq('member_id', tid)
      .maybeSingle();

    if (!r2.data || !checkPassword(password, r2.data.password)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Migrate plain text to hash if needed
    if (r2.data.password === password) {
      await sb.from('passwords')
        .update({ password: hashPassword(password) })
        .eq('member_id', tid);
    }

    return res.status(200).json({
      user: {
        id:      tid,
        name:    tname,
        username: tuname,
        role:    'superadmin',
        isAdmin: true,
        bizId:   null
      }
    });
  }

  // Business user
  var r3 = await sb.from('members')
    .select('id, name, username, role, is_admin, shift, expected_hours, color, bg, business_id')
    .ilike('username', username)
    .neq('role', 'superadmin')
    .not('business_id', 'is', null);

  var members = r3.data || [];
  if (members.length === 0) {
    return res.status(404).json({ error: 'Username not found' });
  }

  var matchedMember = null;
  var matchedBiz    = null;

  for (var i = 0; i < members.length; i++) {
    var mem   = members[i];
    var memId = mem.id;

    var r5 = await sb.from('passwords')
      .select('password')
      .eq('member_id', memId)
      .maybeSingle();

    if (r5.data && checkPassword(password, r5.data.password)) {
      matchedMember = mem;

      // Migrate plain text to hash
      if (r5.data.password === password) {
        await sb.from('passwords')
          .update({ password: hashPassword(password) })
          .eq('member_id', memId);
      }

      var r6 = await sb.from('businesses')
        .select('id, name, code')
        .eq('id', mem.business_id)
        .maybeSingle();
      matchedBiz = r6.data;
      break;
    }
  }

  if (!matchedMember || !matchedBiz) {
    return res.status(401).json({ error: 'Incorrect username or password' });
  }

  var bizId2 = matchedBiz.id;

  var r7 = await sb.from('members')
    .select('id, name, username, role, is_admin, shift, expected_hours, color, bg')
    .eq('business_id', bizId2)
    .neq('role', 'superadmin');

  return res.status(200).json({
    user: {
      id:      matchedMember.id,
      name:    matchedMember.name,
      username: matchedMember.username,
      role:    (matchedMember.role === 'manager' || matchedMember.role === 'subadmin') ? matchedMember.role : 'staff',
      isAdmin: matchedMember.is_admin,
      bizId:   bizId2,
      bizName: matchedBiz.name
    },
    members: r7.data || []
  });
};
