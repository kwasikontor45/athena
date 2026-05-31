function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestGet({ params, env }) {
  const learner = await env.DB.prepare('SELECT id, display_name, cohort_code, created_at FROM learners WHERE id = ?').bind(params.id).first()
  if (!learner) return E('learner not found', 404)

  const { results: events } = await env.DB.prepare(
    'SELECT lesson, event, context, attempts, time_ms, timestamp FROM events WHERE learner_id = ? ORDER BY timestamp ASC'
  ).bind(params.id).all()

  return Response.json({ learner, events })
}
