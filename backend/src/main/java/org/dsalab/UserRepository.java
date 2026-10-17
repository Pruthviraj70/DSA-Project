package org.dsalab;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<LabUser,Long>{Optional<LabUser> findByEmail(String email);}
