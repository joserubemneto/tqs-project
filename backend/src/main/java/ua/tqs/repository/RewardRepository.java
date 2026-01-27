package ua.tqs.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Partner;
import ua.tqs.model.Reward;
import ua.tqs.model.enums.RewardType;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {

    List<Reward> findByActiveTrue();

    List<Reward> findByPartner(Partner partner);

    List<Reward> findByType(RewardType type);

    Page<Reward> findByActiveTrueOrderByPointsCostAsc(Pageable pageable);

    @Query("SELECT r FROM Reward r WHERE r.active = true AND " +
           "(r.availableFrom IS NULL OR r.availableFrom <= :now) AND " +
           "(r.availableUntil IS NULL OR r.availableUntil >= :now)")
    List<Reward> findAvailableRewards(@Param("now") LocalDateTime now);
}
