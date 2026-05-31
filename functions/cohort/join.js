function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestPost({ request, env }) {
  const { learner_id, cohort_code } = await request.json().catch(() => ({}))
  if (!learner_id || !cohort_code) return E('learner_id and cohort_code required')

  const learner = await env.DB.prepare('SELECT id FROM learners WHERE id = ?').bind(learner_id).first()
  if (!learner) return E('learner not found', 404)

  await env.DB.prepare('UPDATE learners SET cohort_code = ? WHERE id = ?').bind(cohort_code.toUpperCase(), learner_id).run()
  return Response.json({ ok: true })
}
