package org.dsalab;

import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperimentRepository extends JpaRepository<Experiment, Long> {
  Page<Experiment> findByUserIdOrderByCreatedAtDesc(long userId, Pageable page);

  Optional<Experiment> findByIdAndUserId(long id, long userId);
}
