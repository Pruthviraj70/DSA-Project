-- Run against a disposable development database. Queries contain no credentials.
-- 1. Join the normalized curriculum and its versions.
SELECT t.title AS topic, l.title AS lesson, a.slug, av.version, av.complexity
FROM topics t JOIN lessons l ON l.topic_id=t.id
JOIN algorithms a ON a.lesson_id=l.id
JOIN algorithm_versions av ON av.algorithm_id=a.id ORDER BY a.id;

-- 2. Aggregate attempts without counting each answer as another attempt.
SELECT l.slug, COUNT(a.id) AS attempts,
       ROUND(AVG(100.0*a.score/NULLIF(a.total,0)),2) AS average_percent
FROM lessons l LEFT JOIN attempts a ON a.lesson_id=l.id
GROUP BY l.id,l.slug ORDER BY average_percent;

-- 3. Read the V1 report view, retaining revision identity.
SELECT module_id, stable_key, revision, answer_count, missed_count, miss_percent
FROM difficult_questions WHERE answer_count>0
ORDER BY miss_percent DESC, answer_count DESC;

-- 4. Instructor topic report: sum counts, do not average percentages.
SELECT module_id, SUM(answer_count) AS answers, SUM(missed_count) AS missed,
       ROUND(100.0*SUM(missed_count)/NULLIF(SUM(answer_count),0),2) AS miss_percent
FROM difficult_questions GROUP BY module_id ORDER BY miss_percent DESC;

-- 5. Inspect the existing owner/history index. Substitute a real development user ID.
EXPLAIN SELECT id,title,created_at FROM saved_experiments
WHERE user_id=1 ORDER BY created_at DESC LIMIT 20;
SHOW INDEX FROM saved_experiments;
-- Measured future alternative, not needed by this release:
-- CREATE INDEX ix_experiment_title ON saved_experiments(user_id,title);

-- 6. Demonstrate monotonic checkpoint upsert and rollback (requires an existing user 1).
START TRANSACTION;
INSERT INTO lesson_progress(user_id,lesson_id,completion,updated_at)
VALUES (1,1,50,CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE completion=GREATEST(completion,50),updated_at=CURRENT_TIMESTAMP(6);
SELECT completion FROM lesson_progress WHERE user_id=1 AND lesson_id=1;
ROLLBACK; -- no checkpoint from this demonstration persists

-- 7. Deliberate instructor provisioning, after checking the selected account.
-- START TRANSACTION;
-- INSERT INTO user_roles(user_id,role_id)
-- SELECT u.id,r.id FROM users u CROSS JOIN roles r
-- WHERE u.email='instructor@example.test' AND r.name='INSTRUCTOR';
-- COMMIT;
-- Sign out/in to refresh session authorities.

-- 8. Historical snapshots remain interpretable independently of current content.
SELECT a.id,l.slug,aa.prompt_snapshot,aa.selected_snapshot,aa.correct_snapshot,
       aa.is_correct,aa.explanation_snapshot
FROM attempts a JOIN lessons l ON l.id=a.lesson_id
JOIN attempt_answers aa ON aa.attempt_id=a.id
WHERE a.user_id=1 ORDER BY a.created_at DESC,aa.id;
