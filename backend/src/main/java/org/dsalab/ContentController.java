package org.dsalab;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modules")
public class ContentController {
  final JdbcTemplate jdbc;

  ContentController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  static int size(int size) {
    if (size < 1 || size > 100) throw new ApiException(400, "validation", "Size must be in 1..100");
    return size;
  }

  static int offset(int page, int size) {
    if (page < 0 || page > 100000) throw new ApiException(400, "validation", "Page out of range");
    return page * size;
  }

  long lesson(String slug) {
    var rows = jdbc.queryForList("SELECT id FROM lessons WHERE slug=?", Long.class, slug);
    if (rows.isEmpty()) throw ApiException.missing();
    return rows.getFirst();
  }

  @GetMapping
  Object list(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    size(size);
    int offset = offset(page, size);
    return Map.of(
        "items",
        jdbc.queryForList(
            "SELECT a.slug AS moduleId,a.title,av.version,av.engine_version AS"
                + " engineVersion,av.complexity,av.invariants,l.body FROM algorithms a JOIN"
                + " algorithm_versions av ON av.algorithm_id=a.id JOIN lessons l ON"
                + " l.id=a.lesson_id WHERE av.id=(SELECT MAX(latest.id) FROM algorithm_versions"
                + " latest WHERE latest.algorithm_id=a.id) ORDER BY a.id LIMIT ? OFFSET ?",
            size,
            offset),
        "total",
        jdbc.queryForObject("SELECT COUNT(*) FROM algorithms", Long.class),
        "page",
        page,
        "size",
        size);
  }

  List<Long> currentRevisions(long lesson) {
    var revisions =
        jdbc.queryForList(
            "SELECT revision_id FROM curriculum_questions WHERE lesson_id=? ORDER BY ordinal",
            Long.class,
            lesson);
    if (!revisions.isEmpty()) return revisions;
    return jdbc.queryForList(
        "SELECT qr.id FROM questions q JOIN question_revisions qr ON qr.question_id=q.id WHERE"
            + " q.lesson_id=? AND qr.revision=(SELECT MAX(r.revision) FROM question_revisions r"
            + " WHERE r.question_id=q.id) ORDER BY q.id",
        Long.class,
        lesson);
  }

  List<Map<String, Object>> reviewLinks(long revision) {
    return jdbc.queryForList(
        "SELECT DISTINCT l.slug AS moduleId,s.slide_key AS slideId,s.title FROM question_concepts"
            + " qc JOIN slide_concepts sc ON sc.concept_id=qc.concept_id JOIN lesson_slides s ON"
            + " s.id=sc.slide_id JOIN lessons l ON l.id=s.lesson_id WHERE qc.revision_id=? ORDER BY"
            + " l.slug,s.slide_key",
        revision);
  }

  @GetMapping("/{slug}/questions")
  Object questions(@PathVariable String slug) {
    long lesson = lesson(slug);
    return currentRevisions(lesson).stream()
        .map(
            revision ->
                jdbc.queryForMap(
                    "SELECT qr.id AS revisionId,qr.question_id AS questionId,qr.revision,qr.prompt"
                        + " FROM question_revisions qr WHERE qr.id=?",
                    revision))
        .map(
            row -> {
              var result = new LinkedHashMap<>(row);
              result.put(
                  "options",
                  jdbc.queryForList(
                      "SELECT id,text FROM answer_options WHERE revision_id=? ORDER BY ordinal",
                      row.get("revisionId")));
              result.put(
                  "concepts",
                  jdbc.queryForList(
                      "SELECT concept_id FROM question_concepts WHERE revision_id=? ORDER BY"
                          + " concept_id",
                      String.class,
                      row.get("revisionId")));
              return result;
            })
        .toList();
  }
}
