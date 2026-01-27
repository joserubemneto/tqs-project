package ua.tqs.model;

import jakarta.persistence.*;
import lombok.*;
import ua.tqs.model.enums.ApplicationStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"volunteer_id", "opportunity_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id", nullable = false)
    private User volunteer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(length = 500)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
    }
}
