package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Skill;
import ua.tqs.model.enums.SkillCategory;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByName(String name);

    List<Skill> findByCategory(SkillCategory category);

    boolean existsByName(String name);
}
