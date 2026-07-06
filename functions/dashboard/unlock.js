const PHRASE_HASH = '0b7e80cfaccb6214ca7089cd1f4f38f32c2d26c7e0a5038307d14eb055f8a06c'
async function rl(ip,ep,lim,DB){const w=Math.floor(Date.now()/60000);try{const r=await DB.prepare('INSERT INTO rate_limits(ip,endpoint,window_min,count)VALUES(?,?,?,1)ON CONFLICT(ip,endpoint,window_min)DO UPDATE SET count=count+1 RETURNING count').bind(ip,ep,w).first();DB.prepare('DELETE FROM rate_limits WHERE window_min<?').bind(w-10).run();return(r?.count??1)>lim}catch{return false}}

export async function onRequestPost({ request, env }) {
  const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  // This endpoint fires on every chat message from every student (the widget
  // checks each message against the unlock phrase before treating it as a
  // question) — a classroom behind one shared IP can burn through a tight
  // limit in seconds and lock the real admin out too. 60/min still makes
  // guessing the passphrase impractical while giving real classroom traffic
  // headroom.
  if (await rl(clientIp, 'unlock', 60, env.DB)) return Response.json({ error: 'too many attempts' }, { status: 429 })

  const { phrase_hash } = await request.json().catch(() => ({}))
  if (!phrase_hash || typeof phrase_hash !== 'string') return Response.json({ error: 'phrase_hash required' }, { status: 400 })
  if (phrase_hash !== PHRASE_HASH) return Response.json({ error: 'unauthorized' }, { status: 401 })

  return Response.json({ url: 'https://athena.kontor.studio/dashboard', secret: env.DASHBOARD_SECRET })
}
