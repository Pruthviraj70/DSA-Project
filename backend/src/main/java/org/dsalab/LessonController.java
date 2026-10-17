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
      boolean seedPosition) {}

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
            "SELECT l.slug AS moduleId,s.slide_key AS slideId,p.completed,p.updated_at AS updatedAt"
                + " FROM lesson_slide_progress p JOIN lesson_slides s ON s.id=p.slide_id JOIN"
                + " lessons l ON l.id=s.lesson_id WHERE p.user_id=? ORDER BY l.id,s.ordinal LIMIT ?"
                + " OFFSET ?",
            owner,
            size,
            offset),
        "total",
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM lesson_slide_progress WHERE user_id=?", Long.class, owner),
        "page",
        page,
        "size",
        size);
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
    jdbc.update(
        "INSERT INTO lesson_slide_progress(user_id,slide_id,completed,updated_at) VALUES"
            + " (?,?,?,CURRENT_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE"
            + " completed=GREATEST(completed,?),updated_at=CURRENT_TIMESTAMP(6)",
        owner,
        slide,
        input.completed(),
        input.completed());
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
