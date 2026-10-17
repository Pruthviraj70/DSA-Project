-- Explicit module completion is separate from page activity and assessment scores.
CREATE TABLE lesson_module_progress (
 user_id BIGINT NOT NULL, lesson_id BIGINT NOT NULL, manual_completed BOOLEAN NOT NULL DEFAULT FALSE,
 generation INT NOT NULL DEFAULT 0, updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 PRIMARY KEY(user_id,lesson_id), FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(lesson_id) REFERENCES lessons(id), CHECK(generation>=0)
);
ALTER TABLE lesson_slide_progress ADD COLUMN generation INT NOT NULL DEFAULT 0;
CREATE TABLE lesson_slide_progress_history (
 user_id BIGINT NOT NULL, slide_id BIGINT NOT NULL, generation INT NOT NULL,
 completed BOOLEAN NOT NULL, updated_at TIMESTAMP(6) NOT NULL,
 PRIMARY KEY(user_id,slide_id,generation), FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(slide_id) REFERENCES lesson_slides(id)
);
CREATE TABLE lesson_module_actions (
 user_id BIGINT NOT NULL, action_id CHAR(36) NOT NULL, lesson_id BIGINT NOT NULL,
 generation INT NOT NULL, completed BOOLEAN NOT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 PRIMARY KEY(user_id,action_id), FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(lesson_id) REFERENCES lessons(id)
);
