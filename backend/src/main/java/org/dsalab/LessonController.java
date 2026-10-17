package org.dsalab;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LessonController {
  final JdbcTemplate jdbc;
  final AuthController auth;
  final ContentController content;

  LessonController(JdbcTemplate jdbc, AuthController auth, ContentController content) {
    this.jdbc = jdbc;
    this.auth = auth;
    this.content = content;
  }

  record Checkpoint(
      @NotBlank @Size(max = 64) String moduleId,
      @NotBlank @Size(max = 64) String slideId,
      boolean completed,
      boolean position,
      boolean seedPosition,
      @Min(0) int generation) {}

  @GetMapping("/lessons")
  Object catalog() {
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT l.slug AS moduleId,l.title,COUNT(s.id) AS slideCount FROM lessons l JOIN"
                + " lesson_slides s ON s.lesson_id=l.id GROUP BY l.id,l.slug,l.title ORDER BY"
                + " l.id"));
  }

  @GetMapping("/learning/progress")
  Object progress(
      Authentication user,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size) {
    int offset = ContentController.offset(page, ContentController.size(size));
    long owner = auth.find(user).getId();
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT l.slug AS moduleId,s.slide_key AS slideId,p.completed,p.generation,p.updated_at"
                + " AS updatedAt FROM lesson_slide_progress p JOIN lesson_slides s ON"
                + " s.id=p.slide_id JOIN lessons l ON l.id=s.lesson_id LEFT JOIN"
                + " lesson_module_progress mp ON mp.user_id=p.user_id AND mp.lesson_id=l.id WHERE"
                + " p.user_id=? AND p.generation=COALESCE(mp.generation,0) ORDER BY l.id,s.ordinal"
                + " LIMIT ? OFFSET ?",
            owner,
            size,
            offset),
        "total",
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM lesson_slide_progress p JOIN lesson_slides s ON s.id=p.slide_id"
                + " LEFT JOIN lesson_module_progress mp ON mp.user_id=p.user_id AND"
                + " mp.lesson_id=s.lesson_id WHERE p.user_id=? AND"
                + " p.generation=COALESCE(mp.generation,0)",
            Long.class,
            owner),
        "page",
        page,
        "size",
        size);
  }

  @GetMapping("/learning/modules")
  Object moduleProgress(Authentication user) {
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT l.slug AS moduleId,p.manual_completed AS manualCompleted,p.generation FROM"
                + " lesson_module_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=?",
            auth.find(user).getId()));
  }

  record ModuleCompletion(boolean completed, @Min(0) int generation, @NotNull UUID actionId) {}

  @PostMapping("/learning/modules/foundations/completion")
  @Transactional
  Object moduleCompletion(Authentication user, @Valid @RequestBody ModuleCompletion input) {
    long owner = auth.find(user).getId(), lesson = content.lesson("foundations");
    jdbc.update(
        "INSERT IGNORE INTO lesson_module_progress(user_id,lesson_id) VALUES (?,?)", owner, lesson);
    var current =
        jdbc.queryForMap(
            "SELECT generation,manual_completed AS manualCompleted FROM lesson_module_progress"
                + " WHERE user_id=? AND lesson_id=? FOR UPDATE",
            owner,
            lesson);
    int generation = ((Number) current.get("generation")).intValue();
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM lesson_module_actions WHERE user_id=? AND action_id=?",
            Integer.class,
            owner,
            input.actionId().toString())
        > 0) return current;
    if (generation != input.generation())
      throw new ApiException(
          409, "progress_changed", "Progress changed on another device. Sync and try again.");
    if (!input.completed()) {
      jdbc.update(
          "INSERT IGNORE INTO lesson_slide_progress_history SELECT"
              + " p.user_id,p.slide_id,p.generation,p.completed,p.updated_at FROM"
              + " lesson_slide_progress p JOIN lesson_slides s ON s.id=p.slide_id WHERE p.user_id=?"
              + " AND s.lesson_id=?",
          owner,
          lesson);
      generation++;
    }
    jdbc.update(
        "UPDATE lesson_module_progress SET"
            + " manual_completed=?,generation=?,updated_at=CURRENT_TIMESTAMP(6) WHERE user_id=? AND"
            + " lesson_id=?",
        input.completed(),
        generation,
        owner,
        lesson);
    jdbc.update(
        "INSERT INTO lesson_module_actions(user_id,action_id,lesson_id,generation,completed) VALUES"
            + " (?,?,?,?,?)",
        owner,
        input.actionId().toString(),
        lesson,
        generation,
        input.completed());
    return Map.of("manualCompleted", input.completed(), "generation", generation);
  }

  @GetMapping("/learning/positions")
  Object positions(Authentication user) {
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT l.slug AS moduleId,s.slide_key AS slideId,p.updated_at AS updatedAt FROM"
                + " lesson_positions p JOIN lessons l ON l.id=p.lesson_id JOIN lesson_slides s ON"
                + " s.id=p.slide_id WHERE p.user_id=? ORDER BY l.id",
            auth.find(user).getId()));
  }

  @PostMapping("/learning/checkpoints")
  @Transactional
  Object checkpoint(Authentication user, @Valid @RequestBody Checkpoint input) {
    long owner = auth.find(user).getId(), lesson = content.lesson(input.moduleId());
    var ids =
        jdbc.queryForList(
            "SELECT id FROM lesson_slides WHERE lesson_id=? AND slide_key=?",
            Long.class,
            lesson,
            input.slideId());
    if (ids.isEmpty()) throw ApiException.missing();
    long slide = ids.getFirst();
    // Serialize Foundations checkpoints with a concurrent explicit reset.
    if (input.moduleId().equals("foundations")) {
      jdbc.update(
          "INSERT IGNORE INTO lesson_module_progress(user_id,lesson_id) VALUES (?,?)",
          owner,
          lesson);
      int current =
          jdbc.queryForObject(
              "SELECT generation FROM lesson_module_progress WHERE user_id=? AND lesson_id=? FOR"
                  + " UPDATE",
              Integer.class,
              owner,
              lesson);
      if (input.generation() != current) return Map.of("ignored", true, "generation", current);
    } else if (input.generation() != 0)
      throw new ApiException(400, "validation", "Invalid progress generation");
    jdbc.update(
        "INSERT INTO lesson_slide_progress(user_id,slide_id,completed,generation,updated_at) VALUES"
            + " (?,?,?,?,CURRENT_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE"
            + " completed=IF(generation=?,GREATEST(completed,?),?),generation=?,updated_at=CURRENT_TIMESTAMP(6)",
        owner,
        slide,
        input.completed(),
        input.generation(),
        input.generation(),
        input.completed(),
        input.completed(),
        input.generation());
    if (input.position()) {
      if (input.seedPosition())
        jdbc.update(
            "INSERT IGNORE INTO lesson_positions(user_id,lesson_id,slide_id) VALUES (?,?,?)",
            owner,
            lesson,
            slide);
      else
        jdbc.update(
            "INSERT INTO lesson_positions(user_id,lesson_id,slide_id,updated_at) VALUES"
                + " (?,?,?,CURRENT_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE"
                + " slide_id=?,updated_at=CURRENT_TIMESTAMP(6)",
            owner,
            lesson,
            slide,
            slide);
    }
    return Map.of(
        "moduleId",
        input.moduleId(),
        "slideId",
        input.slideId(),
        "completed",
        jdbc.queryForObject(
            "SELECT completed FROM lesson_slide_progress WHERE user_id=? AND slide_id=?",
            Boolean.class,
            owner,
            slide));
  }
}
