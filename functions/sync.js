function E(m,s=400){return Response.json({error:m},{status:s})}
function uuid(){return crypto.randomUUID()}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}))
  const { learner_id, snapshot } = body
  if (!learner_id || !snapshot) return E('learner_id and snapshot required')

  const learner = await env.DB.prepare('SELECT id FROM learners WHERE id = ?').bind(learner_id).first()
  if (!learner) return E('learner not found', 404)

  const events = snapshot.events || []
  if (events.length) {
    const stmts = events.map(e =>
      env.DB.prepare('INSERT OR IGNORE INTO events (id,learner_id,session_id,lesson,event,context,attempts,time_ms,timestamp) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(uuid(), learner_id, null, e.lesson||null, e.event||null, e.context||null, e.attempts??0, e.time_ms||null, e.timestamp||Date.now())
    )
    await env.DB.batch(stmts)
  }
  return Response.json({ ok: true, synced: events.length })
}
