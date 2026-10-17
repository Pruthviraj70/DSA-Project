package org.dsalab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.Optional;
public interface ExperimentRepository extends JpaRepository<Experiment,Long>{
 Page<Experiment> findByUserIdOrderByCreatedAtDesc(long userId,Pageable page);
 Optional<Experiment> findByIdAndUserId(long id,long userId);
}
