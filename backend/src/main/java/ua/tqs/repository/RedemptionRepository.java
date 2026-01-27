package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Redemption;
import ua.tqs.model.Reward;
import ua.tqs.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface RedemptionRepository extends JpaRepository<Redemption, Long> {

    List<Redemption> findByUserOrderByRedeemedAtDesc(User user);

    List<Redemption> findByReward(Reward reward);

    Optional<Redemption> findByCode(String code);

    @Query("SELECT COUNT(r) FROM Redemption r WHERE r.reward = :reward")
    long countByReward(@Param("reward") Reward reward);

    @Query("SELECT SUM(r.pointsSpent) FROM Redemption r WHERE r.user = :user")
    Long sumPointsSpentByUser(@Param("user") User user);
}
