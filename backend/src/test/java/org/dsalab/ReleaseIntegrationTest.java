package org.dsalab;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ReleaseIntegrationTest {
  @Container
  static final MySQLContainer<?> mysql =
      new MySQLContainer<>("mysql:8.4.6")
          .withDatabaseName("dsalab")
          .withUsername("dsalab")
          .withPassword("integration-only-password");

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", mysql::getJdbcUrl);
    registry.add("spring.datasource.username", mysql::getUsername);
    registry.add("spring.datasource.password", mysql::getPassword);
  }

  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder encoder;

  record Account(MockHttpSession session, String email, long id) {}

  Account register() throws Exception {
    String email = "student-" + UUID.randomUUID() + "@example.test";
    MvcResult r =
        mvc.perform(
                post("/api/auth/register")
                    .with(csrf())
                    .contentType("application/json")
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "email",
                                email,
                                "password",
                                "test-password-strong",
                                "displayName",
                                "Test Student"))))
            .andExpect(status().isOk())
            .andReturn();
    return new Account(
        (MockHttpSession) r.getRequest().getSession(false),
        email,
        mapper.readTree(r.getResponse().getContentAsString()).path("id").asLong());
  }

  String json(Object value) throws Exception {
    return mapper.writeValueAsString(value);
  }

  @Test
  void realMysqlMigrationsAndSeeds() {
    assertEquals(14, jdbc.queryForObject("SELECT COUNT(*) FROM algorithms", Integer.class));
    assertEquals(47, jdbc.queryForObject("SELECT COUNT(*) FROM question_revisions", Integer.class));
    assertEquals(87, jdbc.queryForObject("SELECT COUNT(*) FROM lesson_slides", Integer.class));
    assertEquals(
        33, jdbc.queryForObject("SELECT COUNT(*) FROM curriculum_questions", Integer.class));
    assertEquals(
        47, jdbc.queryForObject("SELECT COUNT(*) FROM difficult_questions", Integer.class));
    assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM topic_prerequisites", Integer.class) > 10);
    assertEquals(
        4,
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history WHERE success=1", Integer.class));
  }

  @Test
  void publicContentAndPaginationDoNotExposeAnswers() throws Exception {
    mvc.perform(get("/api/modules?size=3&page=1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(3))
        .andExpect(jsonPath("$.total").value(14));
    String response =
        mvc.perform(get("/api/modules/bst/questions"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    mvc.perform(get("/api/modules?size=100"))
        .andExpect(jsonPath("$.items.length()").value(14))
        .andExpect(jsonPath("$.items[0].engineVersion").value("1.1.0"));
    assertFalse(response.contains("correct"));
    assertFalse(response.contains("explanation"));
    mvc.perform(get("/api/modules?size=1000")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/modules/missing/questions")).andExpect(status().isNotFound());
  }

  @Test
  void authenticationHashesPasswordsAndCreatesSession() throws Exception {
    var account = register();
    var user = users.findByEmail(account.email()).orElseThrow();
    assertNotEquals("test-password-strong", user.getPasswordHash());
    assertTrue(encoder.matches("test-password-strong", user.getPasswordHash()));
    mvc.perform(get("/api/auth/me").session(account.session()))
        .andExpect(jsonPath("$.authenticated").value(true));
    mvc.perform(post("/api/auth/logout").session(account.session()).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("email", account.email(), "password", "wrong"))))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content(
                    json(
                        Map.of(
                            "email",
                            account.email().toUpperCase(Locale.ROOT),
                            "password",
                            "test-password-strong"))))
        .andExpect(status().isOk());
  }

  @Test
  void csrfAndValidationAreEnforced() throws Exception {
    mvc.perform(post("/api/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("email", "bad", "password", "short", "displayName", "x"))))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/experiments")).andExpect(status().isUnauthorized());
    var a = register();
    mvc.perform(
            post("/api/progress/checkpoints")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("moduleId", "arrays", "completion", 101))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void checkpointsMergeMonotonicallyAndRemainPrivate() throws Exception {
    var a = register();
    var b = register();
    for (int completion : new int[] {50, 100, 25})
      mvc.perform(
              post("/api/progress/checkpoints")
                  .session(a.session())
                  .with(csrf())
                  .contentType("application/json")
                  .content(json(Map.of("moduleId", "arrays", "completion", completion))))
          .andExpect(status().isOk());
    mvc.perform(get("/api/progress").session(a.session()))
        .andExpect(jsonPath("$.items[0].completion").value(100));
    mvc.perform(get("/api/progress").session(b.session()))
        .andExpect(jsonPath("$.items.length()").value(0));
  }

  @org.junit.jupiter.params.ParameterizedTest
  @org.junit.jupiter.params.provider.ValueSource(strings = {"1.0.0", "1.1.0"})
  void experimentOwnershipAndPersistence(String version) throws Exception {
    var a = register();
    var b = register();
    String body =
        json(
            Map.of(
                "moduleId",
                "arrays",
                "title",
                "Array case",
                "input",
                Map.of(
                    "module",
                    1,
                    "op",
                    0,
                    "values",
                    List.of(2, 1),
                    "arg",
                    0,
                    "index",
                    0,
                    "directed",
                    false,
                    "edges",
                    List.of()),
                "configuration",
                Map.of("speed", 100),
                "engineVersion",
                version));
    var result =
        mvc.perform(
                post("/api/experiments")
                    .session(a.session())
                    .with(csrf())
                    .contentType("application/json")
                    .content(body))
            .andExpect(status().isOk())
            .andReturn();
    long id = mapper.readTree(result.getResponse().getContentAsString()).path("id").asLong();
    mvc.perform(get("/api/experiments/" + id).session(a.session()))
        .andExpect(jsonPath("$.input.values[0]").value(2));
    mvc.perform(
            post("/api/experiments")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(body.replace("\"op\":0", "\"op\":5")))
        .andExpect(version.equals("1.1.0") ? status().isOk() : status().isBadRequest());
    mvc.perform(get("/api/experiments/" + id).session(b.session()))
        .andExpect(status().isNotFound());
    mvc.perform(delete("/api/experiments/" + id).session(b.session()).with(csrf()))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/experiments?size=1&page=0").session(a.session()))
        .andExpect(jsonPath("$.items.length()").value(1));
    mvc.perform(delete("/api/experiments/" + id).session(a.session()).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/experiments/" + id).session(a.session()))
        .andExpect(status().isNotFound());
  }

  List<Map<String, Object>> answers(String module, boolean correct) {
    return jdbc
        .queryForList(
            "SELECT cq.revision_id AS revisionId,ao.id AS optionId FROM curriculum_questions cq"
                + " JOIN lessons l ON l.id=cq.lesson_id JOIN answer_options ao ON"
                + " ao.revision_id=cq.revision_id WHERE l.slug=? AND ao.is_correct=? ORDER BY"
                + " cq.ordinal,ao.ordinal",
            module,
            correct)
        .stream()
        .collect(
            java.util.stream.Collectors.toMap(
                row -> row.get("revisionId"),
                row -> row,
                (first, other) -> first,
                LinkedHashMap::new))
        .values()
        .stream()
        .toList();
  }

  @Test
  void serverGradesAndRetainsSnapshots() throws Exception {
    var a = register();
    String body = json(Map.of("moduleId", "arrays", "answers", answers("arrays", true)));
    var result =
        mvc.perform(
                post("/api/attempts")
                    .session(a.session())
                    .with(csrf())
                    .contentType("application/json")
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").value(3))
            .andExpect(jsonPath("$.total").value(3))
            .andExpect(jsonPath("$.feedback[0].review[0].slideId").exists())
            .andReturn();
    long id = mapper.readTree(result.getResponse().getContentAsString()).path("id").asLong();
    String original =
        mvc.perform(get("/api/attempts/" + id).session(a.session()))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    long revision = ((Number) answers("arrays", true).getFirst().get("revisionId")).longValue();
    String prompt =
        jdbc.queryForObject(
            "SELECT prompt FROM question_revisions WHERE id=?", String.class, revision);
    try {
      jdbc.update(
          "UPDATE question_revisions SET prompt='A later content edit' WHERE id=?", revision);
      assertEquals(
          original,
          mvc.perform(get("/api/attempts/" + id).session(a.session()))
              .andReturn()
              .getResponse()
              .getContentAsString());
    } finally {
      jdbc.update("UPDATE question_revisions SET prompt=? WHERE id=?", prompt, revision);
    }
    var b = register();
    mvc.perform(get("/api/attempts/" + id).session(b.session())).andExpect(status().isNotFound());
    mvc.perform(
            post("/api/attempts")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(
                    json(
                        Map.of(
                            "moduleId",
                            "arrays",
                            "score",
                            100,
                            "answers",
                            answers("arrays", true)))))
        .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/attempts")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("moduleId", "arrays", "answers", answers("arrays", false)))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(0));
    assertEquals(
        2,
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM attempts WHERE user_id=?", Integer.class, a.id()));
  }

  @Test
  void invalidAnswerRollsBackAttemptTransaction() throws Exception {
    var a = register();
    var submitted = new ArrayList<>(answers("arrays", true));
    var invalid = new LinkedHashMap<>(submitted.getLast());
    invalid.put("optionId", 999999L);
    submitted.set(submitted.size() - 1, invalid);
    int before = jdbc.queryForObject("SELECT COUNT(*) FROM attempts", Integer.class);
    mvc.perform(
            post("/api/attempts")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("moduleId", "arrays", "answers", submitted))))
        .andExpect(status().isBadRequest());
    assertEquals(before, jdbc.queryForObject("SELECT COUNT(*) FROM attempts", Integer.class));
    assertEquals(
        0,
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM attempt_answers aa JOIN attempts a ON a.id=aa.attempt_id WHERE"
                + " a.user_id=?",
            Integer.class,
            a.id()));
  }

  @Test
  void slideProgressIsStableMonotonicPrivateAndDoesNotInheritLegacyCompletion() throws Exception {
    var a = register();
    var b = register();
    mvc.perform(
            post("/api/progress/checkpoints")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("moduleId", "arrays", "completion", 100))))
        .andExpect(status().isOk());
    mvc.perform(get("/api/learning/progress").session(a.session()))
        .andExpect(jsonPath("$.total").value(0));
    for (boolean complete : new boolean[] {true, false})
      mvc.perform(
              post("/api/learning/checkpoints")
                  .session(a.session())
                  .with(csrf())
                  .contentType("application/json")
                  .content(
                      json(
                          Map.of(
                              "moduleId",
                              "arrays",
                              "slideId",
                              "insert",
                              "completed",
                              complete,
                              "position",
                              true,
                              "seedPosition",
                              false))))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.completed").value(true));
    mvc.perform(
            post("/api/learning/checkpoints")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(
                    json(
                        Map.of(
                            "moduleId",
                            "arrays",
                            "slideId",
                            "delete",
                            "completed",
                            false,
                            "position",
                            true,
                            "seedPosition",
                            true))))
        .andExpect(status().isOk());
    mvc.perform(get("/api/learning/positions").session(a.session()))
        .andExpect(jsonPath("$.items[0].slideId").value("insert"));
    mvc.perform(get("/api/learning/progress?size=1&page=0").session(a.session()))
        .andExpect(jsonPath("$.items.length()").value(1))
        .andExpect(jsonPath("$.total").value(2));
    mvc.perform(get("/api/learning/progress").session(b.session()))
        .andExpect(jsonPath("$.total").value(0));
    mvc.perform(get("/api/learning/positions").session(b.session()))
        .andExpect(jsonPath("$.items.length()").value(0));
    mvc.perform(
            post("/api/learning/checkpoints")
                .session(a.session())
                .with(csrf())
                .contentType("application/json")
                .content(json(Map.of("moduleId", "arrays", "slideId", "dijkstra"))))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/learning/progress?size=101").session(a.session()))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/learning/progress")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/lessons"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(9));
  }

  @Test
  void instructorReportRequiresRoleAndAggregates() throws Exception {
    var a = register();
    mvc.perform(get("/api/reports/difficult-topics").session(a.session()))
        .andExpect(status().isForbidden());
    jdbc.update("INSERT INTO user_roles VALUES (?,2)", a.id());
    var result =
        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType("application/json")
                    .content(json(Map.of("email", a.email(), "password", "test-password-strong"))))
            .andExpect(status().isOk())
            .andReturn();
    mvc.perform(
            get("/api/reports/difficult-topics?size=5")
                .session((MockHttpSession) result.getRequest().getSession(false)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(5));
  }
}
