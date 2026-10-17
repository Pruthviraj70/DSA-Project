package org.dsalab;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.containers.MySQLContainer;

class MigrationCompatibilityTest {
  @Test
  void upgradeV2PreservesEveryKindOfExistingLearnerDataAndSeedIsRepeatable() throws Exception {
    try (var mysql =
        new MySQLContainer<>("mysql:8.4.6")
            .withDatabaseName("compatibility")
            .withUsername("dsalab")
            .withPassword("integration-only-password")) {
      mysql.start();
      var source =
          new DriverManagerDataSource(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
      var old = Flyway.configure().dataSource(source).target("2").load();
      old.migrate();
      var jdbc = new JdbcTemplate(source);
      jdbc.update(
          "INSERT INTO users(id,email,display_name,password_hash) VALUES"
              + " (900,'legacy@example.test','Existing learner','existing-hash')");
      jdbc.update("INSERT INTO user_roles VALUES (900,1)");
      jdbc.update("INSERT INTO lesson_progress(user_id,lesson_id,completion) VALUES (900,1,100)");
      jdbc.update("INSERT INTO attempts(id,user_id,lesson_id,score,total) VALUES (900,900,1,1,1)");
      jdbc.update(
          "INSERT INTO"
              + " attempt_answers(attempt_id,revision_id,selected_option_id,is_correct,prompt_snapshot,selected_snapshot,correct_snapshot,explanation_snapshot)"
              + " VALUES (900,1,11,1,'Historical prompt','O(n)','O(n)','Historical explanation')");
      jdbc.update(
          "INSERT INTO"
              + " saved_experiments(user_id,algorithm_version_id,title,input_json,configuration_json,engine_version)"
              + " VALUES (900,1,'Keep"
              + " me','{\"module\":1,\"op\":0,\"values\":[4,2]}','{\"speed\":350}','1.0.0')");
      var before = jdbc.queryForMap("SELECT * FROM saved_experiments WHERE user_id=900");
      Flyway.configure().dataSource(source).load().migrate();
      assertEquals(
          "existing-hash",
          jdbc.queryForObject("SELECT password_hash FROM users WHERE id=900", String.class));
      assertEquals(
          1,
          jdbc.queryForObject("SELECT COUNT(*) FROM user_roles WHERE user_id=900", Integer.class));
      assertEquals(
          100,
          jdbc.queryForObject(
              "SELECT completion FROM lesson_progress WHERE user_id=900", Integer.class));
      assertEquals(
          0,
          jdbc.queryForObject(
              "SELECT COUNT(*) FROM lesson_slide_progress WHERE user_id=900", Integer.class));
      assertEquals(
          0,
          jdbc.queryForObject(
              "SELECT COUNT(*) FROM lesson_positions WHERE user_id=900", Integer.class));
      assertEquals(
          "Historical prompt",
          jdbc.queryForObject(
              "SELECT prompt_snapshot FROM attempt_answers WHERE attempt_id=900", String.class));
      assertEquals(
          1, jdbc.queryForObject("SELECT score FROM attempts WHERE id=900", Integer.class));
      assertEquals(before, jdbc.queryForMap("SELECT * FROM saved_experiments WHERE user_id=900"));
      Map<String, Integer> counts = new LinkedHashMap<>();
      for (String table :
          List.of(
              "topics",
              "lessons",
              "lesson_slides",
              "curriculum_concepts",
              "questions",
              "question_revisions",
              "answer_options",
              "question_concepts",
              "slide_concepts",
              "curriculum_questions",
              "algorithm_versions",
              "topic_prerequisites"))
        counts.put(table, jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class));
      try (var connection = source.getConnection()) {
        ScriptUtils.executeSqlScript(
            connection, new ClassPathResource("db/migration/V4__aligned_curriculum.sql"));
      }
      try (var connection = source.getConnection()) {
        ScriptUtils.executeSqlScript(
            connection, new ClassPathResource("db/migration/V6__next_modules.sql"));
      }
      for (var entry : counts.entrySet())
        assertEquals(
            entry.getValue(),
            jdbc.queryForObject("SELECT COUNT(*) FROM " + entry.getKey(), Integer.class),
            entry.getKey());
      assertEquals(145, counts.get("lesson_slides"));
      assertEquals(48, counts.get("algorithm_versions"));
    }
  }
}
