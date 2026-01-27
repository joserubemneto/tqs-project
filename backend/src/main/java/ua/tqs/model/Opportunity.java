package ua.tqs.model;

import jakarta.persistence.*;
import lombok.*;
import ua.tqs.model.enums.OpportunityStatus;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "opportunities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private Integer pointsReward;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private Integer maxVolunteers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OpportunityStatus status = OpportunityStatus.DRAFT;

    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promoter_id", nullable = false)
    private User promoter;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "opportunity_skills",
        joinColumns = @JoinColumn(name = "opportunity_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> requiredSkills = new HashSet<>();

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Application> applications = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
