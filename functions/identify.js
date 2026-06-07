function R(d,s=200){return Response.json(d,{status:s})}
function E(m,s=400){return Response.json({error:m},{status:s})}
function uuid(){return crypto.randomUUID()}
async function sha256(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t.toLowerCase().trim()));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function rl(ip,ep,lim,DB){const w=Math.floor(Date.now()/60000);try{const r=await DB.prepare('INSERT INTO rate_limits(ip,endpoint,window_min,count)VALUES(?,?,?,1)ON CONFLICT(ip,endpoint,window_min)DO UPDATE SET count=count+1 RETURNING count').bind(ip,ep,w).first();DB.prepare('DELETE FROM rate_limits WHERE window_min<?').bind(w-10).run();return(r?.count??1)>lim}catch{return false}}

export async function onRequestPost({ request, env }) {
  const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  if (await rl(clientIp, 'identify', 10, env.DB)) return E('too many requests', 429)

  const { passphrase, display_name } = await request.json().catch(() => ({}))
  if (!passphrase || typeof passphrase !== 'string') return E('passphrase required')

  const hash = await sha256(passphrase)
  const existing = await env.DB.prepare('SELECT id FROM learners WHERE passphrase_hash = ?').bind(hash).first()
  if (existing) return R({ learner_id: existing.id, token: existing.id, is_new: false })

  const id = uuid()
  await env.DB.prepare('INSERT INTO learners (id, passphrase_hash, display_name, created_at) VALUES (?, ?, ?, ?)').bind(id, hash, display_name || null, Date.now()).run()
  return R({ learner_id: id, token: id, is_new: true })
}
