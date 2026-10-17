package org.dsalab;

import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LearningController {
  final AuthController auth;
  final ContentController content;
  final ProgressRepository progress;
  final ExperimentRepository experiments;
  final JdbcTemplate jdbc;
  final ObjectMapper mapper;

  LearningController(
      AuthController auth,
      ContentController content,
      ProgressRepository progress,
      ExperimentRepository experiments,
      JdbcTemplate jdbc,
      ObjectMapper mapper) {
    this.auth = auth;
    this.content = content;
    this.progress = progress;
    this.experiments = experiments;
    this.jdbc = jdbc;
    this.mapper = mapper;
  }

  record Checkpoint(@NotBlank @Size(max = 64) String moduleId, @Min(0) @Max(100) int completion) {}

  record Saved(
      @NotBlank @Size(max = 64) String moduleId,
      @NotBlank @Size(max = 120) String title,
      @NotNull JsonNode input,
      @NotNull JsonNode configuration,
      @Pattern(regexp = "1\\.[01]\\.0") @NotBlank String engineVersion) {}

  record Answer(@NotNull @Positive Long revisionId, @NotNull @Positive Long optionId) {}

  record Submission(
      @NotBlank @Size(max = 64) String moduleId,
      @NotEmpty @Size(max = 100) List<@Valid Answer> answers) {}

  @GetMapping("/progress")
  Object progress(
      Authentication a,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    int offset = ContentController.offset(page, ContentController.size(size));
    long owner = auth.find(a).getId();
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT l.slug AS moduleId,p.completion,p.updated_at AS updatedAt FROM lesson_progress"
                + " p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? ORDER BY p.id LIMIT ?"
                + " OFFSET ?",
            owner,
            size,
            offset),
        "page",
        page,
        "size",
        size,
        "total",
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM lesson_progress WHERE user_id=?", Long.class, owner));
  }

  @PostMapping("/progress/checkpoints")
  @Transactional
  Object checkpoint(Authentication a, @Valid @RequestBody Checkpoint input) {
    long owner = auth.find(a).getId(), lesson = content.lesson(input.moduleId());
    progress.checkpoint(owner, lesson, input.completion());
    return Map.of(
        "moduleId",
        input.moduleId(),
        "completion",
        jdbc.queryForObject(
            "SELECT completion FROM lesson_progress WHERE user_id=? AND lesson_id=?",
            Integer.class,
            owner,
            lesson));
  }

  private Map<String, Object> experimentView(Experiment x) {
    try {
      return Map.of(
          "id",
          x.getId(),
          "title",
          x.getTitle(),
          "moduleId",
          jdbc.queryForObject(
              "SELECT a.slug FROM algorithm_versions av JOIN algorithms a ON a.id=av.algorithm_id"
                  + " WHERE av.id=?",
              String.class,
              x.getAlgorithmVersionId()),
          "input",
          mapper.readTree(x.getInputJson()),
          "configuration",
          mapper.readTree(x.getConfigurationJson()),
          "engineVersion",
          x.getEngineVersion(),
          "createdAt",
          x.getCreatedAt());
    } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
      throw new IllegalStateException("Stored JSON is invalid", ex);
    }
  }

  @GetMapping("/experiments")
  Object experiments(
      Authentication a,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    ContentController.offset(page, ContentController.size(size));
    var p =
        experiments.findByUserIdOrderByCreatedAtDesc(
            auth.find(a).getId(), PageRequest.of(page, size));
    return Map.of(
        "items",
        p.getContent().stream().map(this::experimentView).toList(),
        "total",
        p.getTotalElements(),
        "page",
        page,
        "size",
        size);
  }

  @PostMapping("/experiments")
  @Transactional
  Object save(Authentication a, @Valid @RequestBody Saved input) {
    if (!input.input().isObject()
        || !input.configuration().isObject()
        || input.input().toString().length() > 20000
        || input.configuration().toString().length() > 4000)
      throw new ApiException(400, "validation", "Experiment payload must be a small JSON object");
    var versions =
        jdbc.queryForList(
            "SELECT av.id,al.id AS module_id FROM algorithm_versions av JOIN algorithms al ON"
                + " al.id=av.algorithm_id WHERE al.slug=? AND av.engine_version=? AND av.version=?",
            input.moduleId(),
            input.engineVersion(),
            input.engineVersion());
    if (versions.isEmpty()) throw ApiException.missing();
    if (input.configuration().size() != 1
        || !input.configuration().has("speed")
        || !input.configuration().get("speed").isIntegralNumber()
        || !input.configuration().get("speed").canConvertToInt()
        || input.configuration().get("speed").asInt() < 30
        || input.configuration().get("speed").asInt() > 1000)
      throw new ApiException(
          400, "validation", "Playback configuration requires a speed in 30..1000 ms");
    validateInput(input.input(), ((Number) versions.getFirst().get("module_id")).intValue());
    if (input.engineVersion().equals("1.0.0")
        && input.input().path("module").asInt() == 1
        && input.input().path("op").asInt() == 5)
      throw new ApiException(
          400, "validation", "This operation requires the current saved-input format");
    var x = new Experiment();
    x.setUserId(auth.find(a).getId());
    x.setAlgorithmVersionId(((Number) versions.getFirst().get("id")).longValue());
    x.setTitle(input.title().trim());
    x.setInputJson(input.input().toString());
    x.setConfigurationJson(input.configuration().toString());
    x.setEngineVersion(input.engineVersion());
    x.setCreatedAt(Instant.now());
    return experimentView(experiments.saveAndFlush(x));
  }

  private static void validateInput(JsonNode input, int module) {
    Set<String> allowed =
        Set.of("module", "op", "values", "arg", "index", "directed", "edges", "weight");
    input
        .fieldNames()
        .forEachRemaining(
            name -> {
              if (!allowed.contains(name))
                throw new ApiException(400, "validation", "Unsupported engine input field");
            });
    for (String name : List.of("module", "op", "arg", "index"))
      if (!input.has(name)
          || !input.get(name).isIntegralNumber()
          || !input.get(name).canConvertToInt())
        throw new ApiException(400, "validation", "Engine parameters must be integers");
    int[] operations = {0, 6, 1, 1, 1, 1, 1, 4, 3, 3, 6, 5, 1, 1, 1};
    if (input.get("module").asInt() != module
        || input.get("op").asInt() < 0
        || input.get("op").asInt() >= operations[module]
        || Math.abs((long) input.get("arg").asInt()) > 100000
        || Math.abs((long) input.get("index").asInt()) > 100000)
      throw new ApiException(400, "validation", "Engine module or parameter out of range");
    JsonNode values = input.get("values"), edges = input.get("edges");
    if (values == null
        || !values.isArray()
        || values.size() > (module >= 11 ? 16 : 32)
        || edges == null
        || !edges.isArray()
        || edges.size() > 256
        || !input.has("directed")
        || !input.get("directed").isBoolean())
      throw new ApiException(400, "validation", "Invalid sequence or graph input");
    Set<Integer> ids = new HashSet<>();
    for (JsonNode value : values) {
      if (!value.isIntegralNumber()
          || !value.canConvertToInt()
          || Math.abs((long) value.asInt()) > 100000
          || (module >= 11 && (value.asInt() < 1 || value.asInt() > 31 || !ids.add(value.asInt()))))
        throw new ApiException(400, "validation", "Invalid value or duplicate graph ID");
    }
    for (JsonNode edge : edges) {
      for (String key : List.of("from", "to", "weight"))
        if (!edge.has(key) || !edge.get(key).isIntegralNumber() || !edge.get(key).canConvertToInt())
          throw new ApiException(400, "validation", "Invalid graph edge");
      if (module < 11
          || edge.get("from").asInt() < 0
          || edge.get("to").asInt() < 0
          || edge.get("from").asInt() >= values.size()
          || edge.get("to").asInt() >= values.size()
          || Math.abs((long) edge.get("weight").asInt()) > 100000)
        throw new ApiException(400, "validation", "Invalid graph edge endpoint or weight");
    }
    if (input.has("weight")
        && (!input.get("weight").isIntegralNumber()
            || !input.get("weight").canConvertToInt()
            || Math.abs((long) input.get("weight").asInt()) > 100000))
      throw new ApiException(400, "validation", "Invalid operation weight");
  }

  @GetMapping("/experiments/{id}")
  Object experiment(Authentication a, @PathVariable long id) {
    return experimentView(
        experiments.findByIdAndUserId(id, auth.find(a).getId()).orElseThrow(ApiException::missing));
  }

  @DeleteMapping("/experiments/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  @Transactional
  void delete(Authentication a, @PathVariable long id) {
    experiments.delete(
        experiments.findByIdAndUserId(id, auth.find(a).getId()).orElseThrow(ApiException::missing));
  }

  @PostMapping("/attempts")
  @Transactional
  Object submit(Authentication a, @Valid @RequestBody Submission input) {
    long lesson = content.lesson(input.moduleId());
    var expected = content.currentRevisions(lesson);
    var received = input.answers().stream().map(Answer::revisionId).toList();
    if (expected.isEmpty()
        || !new HashSet<>(expected).equals(new HashSet<>(received))
        || received.size() != expected.size())
      throw new ApiException(
          400, "validation", "Submit one answer for each current question revision");
    // Insert first; any later invalid option must roll this row back as well as all answers.
    var keys = new org.springframework.jdbc.support.GeneratedKeyHolder();
    long owner = auth.find(a).getId();
    jdbc.update(
        connection -> {
          var statement =
              connection.prepareStatement(
                  "INSERT INTO attempts(user_id,lesson_id,score,total) VALUES (?,?,0,?)",
                  java.sql.Statement.RETURN_GENERATED_KEYS);
          statement.setLong(1, owner);
          statement.setLong(2, lesson);
          statement.setInt(3, expected.size());
          return statement;
        },
        keys);
    long attempt = Objects.requireNonNull(keys.getKey()).longValue();
    int score = 0;
    List<Map<String, Object>> feedback = new ArrayList<>();
    for (Answer answer : input.answers()) {
      var rows =
          jdbc.queryForList(
              "SELECT ao.is_correct,ao.text,qr.prompt,qr.explanation FROM answer_options ao JOIN"
                  + " question_revisions qr ON qr.id=ao.revision_id WHERE ao.id=? AND"
                  + " ao.revision_id=?",
              answer.optionId(),
              answer.revisionId());
      if (rows.isEmpty())
        throw new ApiException(
            400, "validation", "Answer option does not belong to the submitted question");
      var row = rows.getFirst();
      Object raw = row.get("is_correct");
      boolean correct = raw instanceof Boolean b ? b : ((Number) raw).intValue() == 1;
      // MySQL JDBC may expose BOOLEAN as Boolean instead of Number.
      String correctText =
          jdbc.queryForObject(
              "SELECT text FROM answer_options WHERE revision_id=? AND is_correct=1",
              String.class,
              answer.revisionId());
      if (correct) score++;
      jdbc.update(
          "INSERT INTO"
              + " attempt_answers(attempt_id,revision_id,selected_option_id,is_correct,prompt_snapshot,selected_snapshot,correct_snapshot,explanation_snapshot)"
              + " VALUES (?,?,?,?,?,?,?,?)",
          attempt,
          answer.revisionId(),
          answer.optionId(),
          correct,
          row.get("prompt"),
          row.get("text"),
          correctText,
          row.get("explanation"));
      feedback.add(
          Map.of(
              "revisionId",
              answer.revisionId(),
              "correct",
              correct,
              "correctAnswer",
              correctText,
              "explanation",
              row.get("explanation"),
              "review",
              content.reviewLinks(answer.revisionId())));
    }
    jdbc.update("UPDATE attempts SET score=? WHERE id=?", score, attempt);
    return Map.of("id", attempt, "score", score, "total", expected.size(), "feedback", feedback);
  }

  @GetMapping("/attempts")
  Object attempts(
      Authentication a,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    int offset = ContentController.offset(page, ContentController.size(size));
    long owner = auth.find(a).getId();
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT a.id,l.slug AS moduleId,a.score,a.total,a.created_at AS createdAt FROM attempts"
                + " a JOIN lessons l ON l.id=a.lesson_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT"
                + " ? OFFSET ?",
            owner,
            size,
            offset),
        "total",
        jdbc.queryForObject("SELECT COUNT(*) FROM attempts WHERE user_id=?", Long.class, owner),
        "page",
        page,
        "size",
        size);
  }

  @GetMapping("/attempts/{id}")
  Object attempt(Authentication a, @PathVariable long id) {
    var rows =
        jdbc.queryForList(
            "SELECT id,score,total,created_at AS createdAt FROM attempts WHERE id=? AND user_id=?",
            id,
            auth.find(a).getId());
    if (rows.isEmpty()) throw ApiException.missing();
    var result = new LinkedHashMap<>(rows.getFirst());
    result.put(
        "answers",
        jdbc.queryForList(
            "SELECT prompt_snapshot AS prompt,selected_snapshot AS selectedAnswer,correct_snapshot"
                + " AS correctAnswer,explanation_snapshot AS explanation,is_correct AS correct FROM"
                + " attempt_answers WHERE attempt_id=? ORDER BY id",
            id));
    return result;
  }

  @GetMapping("/reports/difficult-topics")
  Object report(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    int offset = ContentController.offset(page, ContentController.size(size));
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT * FROM difficult_questions ORDER BY miss_percent DESC,answer_count"
                + " DESC,module_id LIMIT ? OFFSET ?",
            size,
            offset),
        "page",
        page,
        "size",
        size,
        "total",
        jdbc.queryForObject("SELECT COUNT(*) FROM difficult_questions", Long.class));
  }
}
