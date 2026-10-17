package org.dsalab;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
@RestController @RequestMapping("/api/modules")
public class ContentController {
 final JdbcTemplate jdbc;
 ContentController(JdbcTemplate jdbc){this.jdbc=jdbc;}
 static int size(int size){if(size<1||size>100)throw new ApiException(400,"validation","Size must be in 1..100");return size;}
 static int offset(int page,int size){if(page<0||page>100000)throw new ApiException(400,"validation","Page out of range");return page*size;}
 long lesson(String slug){var rows=jdbc.queryForList("SELECT id FROM lessons WHERE slug=?",Long.class,slug);if(rows.isEmpty())throw ApiException.missing();return rows.getFirst();}
 @GetMapping Object list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
  size(size);int offset=offset(page,size);
  return Map.of("items",jdbc.queryForList("SELECT a.slug AS moduleId,a.title,av.version,av.engine_version AS engineVersion,av.complexity,av.invariants,l.body FROM algorithms a JOIN algorithm_versions av ON av.algorithm_id=a.id JOIN lessons l ON l.id=a.lesson_id ORDER BY a.id LIMIT ? OFFSET ?",size,offset),"total",jdbc.queryForObject("SELECT COUNT(*) FROM algorithms",Long.class),"page",page,"size",size);
 }
 @GetMapping("/{slug}/questions") Object questions(@PathVariable String slug){
  long lesson=lesson(slug);
  return jdbc.queryForList("SELECT qr.id AS revisionId,q.id AS questionId,qr.revision,qr.prompt FROM questions q JOIN question_revisions qr ON qr.question_id=q.id WHERE q.lesson_id=? AND qr.revision=(SELECT MAX(r.revision) FROM question_revisions r WHERE r.question_id=q.id) ORDER BY q.id",lesson).stream().map(row->{
   var result=new LinkedHashMap<>(row);result.put("options",jdbc.queryForList("SELECT id,text FROM answer_options WHERE revision_id=? ORDER BY ordinal",row.get("revisionId")));return result;
  }).toList();
 }
}
