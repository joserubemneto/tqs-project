package ua.tqs.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Opportunity;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {

    Page<Opportunity> findByStatus(OpportunityStatus status, Pageable pageable);

    List<Opportunity> findByPromoter(User promoter);

    Page<Opportunity> findByStatusAndStartDateAfter(
        OpportunityStatus status,
        LocalDateTime startDate,
        Pageable pageable
    );

    @Query("SELECT o FROM Opportunity o WHERE o.status = :status AND o.startDate > :now ORDER BY o.startDate ASC")
    Page<Opportunity> findUpcomingOpportunities(
        @Param("status") OpportunityStatus status,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.status = :status")
    long countByStatus(@Param("status") OpportunityStatus status);
}
