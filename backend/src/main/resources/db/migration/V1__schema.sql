CREATE TABLE users (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(254) NOT NULL, display_name VARCHAR(80) NOT NULL,
 password_hash VARCHAR(100) NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT uq_users_email UNIQUE(email)
);
CREATE TABLE roles (id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) NOT NULL UNIQUE);
CREATE TABLE user_roles (user_id BIGINT NOT NULL, role_id BIGINT NOT NULL, PRIMARY KEY(user_id,role_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(role_id) REFERENCES roles(id));
CREATE TABLE topics (id BIGINT PRIMARY KEY AUTO_INCREMENT, slug VARCHAR(64) NOT NULL UNIQUE, title VARCHAR(100) NOT NULL);
CREATE TABLE topic_prerequisites (topic_id BIGINT NOT NULL, prerequisite_id BIGINT NOT NULL, PRIMARY KEY(topic_id,prerequisite_id), FOREIGN KEY(topic_id) REFERENCES topics(id), FOREIGN KEY(prerequisite_id) REFERENCES topics(id), CHECK(topic_id<>prerequisite_id));
CREATE TABLE lessons (id BIGINT PRIMARY KEY AUTO_INCREMENT, topic_id BIGINT NOT NULL, slug VARCHAR(64) NOT NULL UNIQUE, title VARCHAR(100) NOT NULL, body TEXT NOT NULL, FOREIGN KEY(topic_id) REFERENCES topics(id));
CREATE TABLE algorithms (id BIGINT PRIMARY KEY AUTO_INCREMENT, lesson_id BIGINT NOT NULL, slug VARCHAR(64) NOT NULL UNIQUE, title VARCHAR(100) NOT NULL, FOREIGN KEY(lesson_id) REFERENCES lessons(id));
CREATE TABLE algorithm_versions (id BIGINT PRIMARY KEY AUTO_INCREMENT, algorithm_id BIGINT NOT NULL, version VARCHAR(32) NOT NULL, engine_version VARCHAR(32) NOT NULL, complexity TEXT NOT NULL, invariants TEXT NOT NULL, UNIQUE(algorithm_id,version), FOREIGN KEY(algorithm_id) REFERENCES algorithms(id));
CREATE TABLE questions (id BIGINT PRIMARY KEY AUTO_INCREMENT, lesson_id BIGINT NOT NULL, stable_key VARCHAR(100) NOT NULL UNIQUE, FOREIGN KEY(lesson_id) REFERENCES lessons(id));
CREATE TABLE question_revisions (id BIGINT PRIMARY KEY AUTO_INCREMENT, question_id BIGINT NOT NULL, revision INT NOT NULL, prompt TEXT NOT NULL, explanation TEXT NOT NULL, UNIQUE(question_id,revision), FOREIGN KEY(question_id) REFERENCES questions(id));
CREATE TABLE answer_options (id BIGINT PRIMARY KEY AUTO_INCREMENT, revision_id BIGINT NOT NULL, ordinal INT NOT NULL, text VARCHAR(1000) NOT NULL, is_correct BOOLEAN NOT NULL, UNIQUE(revision_id,ordinal), UNIQUE(id,revision_id), FOREIGN KEY(revision_id) REFERENCES question_revisions(id));
CREATE TABLE attempts (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, lesson_id BIGINT NOT NULL, score INT NOT NULL, total INT NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(lesson_id) REFERENCES lessons(id), CHECK(score>=0 AND score<=total));
CREATE INDEX ix_attempts_user_created ON attempts(user_id,created_at);
CREATE TABLE attempt_answers (id BIGINT PRIMARY KEY AUTO_INCREMENT, attempt_id BIGINT NOT NULL, revision_id BIGINT NOT NULL, selected_option_id BIGINT NOT NULL, is_correct BOOLEAN NOT NULL, prompt_snapshot TEXT NOT NULL, selected_snapshot TEXT NOT NULL, correct_snapshot TEXT NOT NULL, explanation_snapshot TEXT NOT NULL, UNIQUE(attempt_id,revision_id), FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(revision_id) REFERENCES question_revisions(id), FOREIGN KEY(selected_option_id,revision_id) REFERENCES answer_options(id,revision_id));
CREATE INDEX ix_answers_revision_correct ON attempt_answers(revision_id,is_correct);
CREATE TABLE lesson_progress (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, lesson_id BIGINT NOT NULL, completion INT NOT NULL, updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE(user_id,lesson_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(lesson_id) REFERENCES lessons(id), CHECK(completion BETWEEN 0 AND 100));
CREATE TABLE saved_experiments (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, algorithm_version_id BIGINT NOT NULL, title VARCHAR(120) NOT NULL, input_json JSON NOT NULL, configuration_json JSON NOT NULL, engine_version VARCHAR(32) NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(algorithm_version_id) REFERENCES algorithm_versions(id));
CREATE INDEX ix_experiments_owner_created ON saved_experiments(user_id,created_at);
CREATE VIEW difficult_questions AS
 SELECT l.slug AS module_id, q.stable_key, qr.revision, qr.prompt, COUNT(aa.id) AS answer_count,
 SUM(CASE WHEN aa.is_correct = 0 THEN 1 ELSE 0 END) AS missed_count,
 ROUND(100.0 * SUM(CASE WHEN aa.is_correct = 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(aa.id),0),2) AS miss_percent
 FROM questions q JOIN lessons l ON l.id=q.lesson_id JOIN question_revisions qr ON qr.question_id=q.id
 LEFT JOIN attempt_answers aa ON aa.revision_id=qr.id GROUP BY l.slug,q.stable_key,qr.revision,qr.prompt;
