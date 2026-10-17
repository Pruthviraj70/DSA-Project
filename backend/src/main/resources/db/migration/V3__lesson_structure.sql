-- Additive: V1/V2 accounts, attempts, experiments and percentage progress are unchanged.
CREATE TABLE curriculum_concepts (
 id VARCHAR(100) PRIMARY KEY, title VARCHAR(200) NOT NULL
);
CREATE TABLE lesson_slides (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, lesson_id BIGINT NOT NULL, slide_key VARCHAR(64) NOT NULL,
 ordinal INT NOT NULL, title VARCHAR(160) NOT NULL, kind VARCHAR(32) NOT NULL,
 UNIQUE(lesson_id,slide_key), UNIQUE(lesson_id,ordinal), UNIQUE(id,lesson_id),
 FOREIGN KEY(lesson_id) REFERENCES lessons(id)
);
CREATE TABLE slide_concepts (
 slide_id BIGINT NOT NULL, concept_id VARCHAR(100) NOT NULL, PRIMARY KEY(slide_id,concept_id),
 FOREIGN KEY(slide_id) REFERENCES lesson_slides(id), FOREIGN KEY(concept_id) REFERENCES curriculum_concepts(id)
);
CREATE TABLE question_concepts (
 revision_id BIGINT NOT NULL, concept_id VARCHAR(100) NOT NULL, PRIMARY KEY(revision_id,concept_id),
 FOREIGN KEY(revision_id) REFERENCES question_revisions(id), FOREIGN KEY(concept_id) REFERENCES curriculum_concepts(id)
);
CREATE TABLE curriculum_questions (
 lesson_id BIGINT NOT NULL, question_id BIGINT NOT NULL, revision_id BIGINT NOT NULL,
 ordinal INT NOT NULL, PRIMARY KEY(lesson_id,question_id), UNIQUE(lesson_id,ordinal),
 FOREIGN KEY(lesson_id) REFERENCES lessons(id), FOREIGN KEY(question_id) REFERENCES questions(id),
 FOREIGN KEY(revision_id) REFERENCES question_revisions(id)
);
CREATE TABLE lesson_slide_progress (
 user_id BIGINT NOT NULL, slide_id BIGINT NOT NULL, completed BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY(user_id,slide_id),
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(slide_id) REFERENCES lesson_slides(id)
);
CREATE TABLE lesson_positions (
 user_id BIGINT NOT NULL, lesson_id BIGINT NOT NULL, slide_id BIGINT NOT NULL,
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY(user_id,lesson_id),
 FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(slide_id,lesson_id) REFERENCES lesson_slides(id,lesson_id)
);
-- No mass completion from old percentages: these slides include newly authored material.
