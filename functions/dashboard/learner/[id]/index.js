function auth(req,env){const s=env.DASHBOARD_SECRET;if(!s)return true;return req.headers.get('Authorization')!==`Bearer ${s}`}
function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestGet({ request, params, env }) {
  if (auth(request, env)) return E('unauthorized', 401)
  const learner = await env.DB.prepare('SELECT id, display_name, cohort_code, created_at FROM learners WHERE id = ?').bind(params.id).first()
  if (!learner) return E('learner not found', 404)

  const { results: events } = await env.DB.prepare(
    'SELECT lesson, event, context, attempts, timestamp FROM events WHERE learner_id = ? ORDER BY timestamp ASC'
  ).bind(params.id).all()

  const lessons_done = new Set(events.filter(e => e.event === 'lesson-complete').map(e => e.lesson)).size
  const last_seen = events.length ? events[events.length - 1].timestamp : null
  return Response.json({ learner, stats: { lessons_done, last_seen }, events })
}
