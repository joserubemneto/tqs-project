package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Partner;

import java.util.List;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Long> {

    List<Partner> findByActiveTrue();
}
