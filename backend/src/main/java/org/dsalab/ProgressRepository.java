package org.dsalab;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface ProgressRepository extends JpaRepository<Progress,Long>{
 @Modifying @Query(value="INSERT INTO lesson_progress(user_id,lesson_id,completion,updated_at) VALUES (:user,:lesson,:completion,CURRENT_TIMESTAMP(6)) ON DUPLICATE KEY UPDATE completion=GREATEST(completion,:completion), updated_at=CURRENT_TIMESTAMP(6)",nativeQuery=true)
 void checkpoint(@Param("user") long user,@Param("lesson") long lesson,@Param("completion") int completion);
}
