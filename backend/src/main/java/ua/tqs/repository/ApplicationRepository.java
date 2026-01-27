package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Application;
import ua.tqs.model.Opportunity;
import ua.tqs.model.User;
import ua.tqs.model.enums.ApplicationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByVolunteer(User volunteer);

    List<Application> findByOpportunity(Opportunity opportunity);

    List<Application> findByOpportunityAndStatus(Opportunity opportunity, ApplicationStatus status);

    Optional<Application> findByVolunteerAndOpportunity(User volunteer, Opportunity opportunity);

    boolean existsByVolunteerAndOpportunity(User volunteer, Opportunity opportunity);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.opportunity = :opportunity AND a.status = :status")
    long countByOpportunityAndStatus(
        @Param("opportunity") Opportunity opportunity,
        @Param("status") ApplicationStatus status
    );

    @Query("SELECT COUNT(a) FROM Application a WHERE a.volunteer = :volunteer AND a.status = :status")
    long countByVolunteerAndStatus(
        @Param("volunteer") User volunteer,
        @Param("status") ApplicationStatus status
    );
}
