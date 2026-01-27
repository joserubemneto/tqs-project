package ua.tqs.model;

import jakarta.persistence.*;
import lombok.*;
import ua.tqs.model.enums.RewardType;

import java.time.LocalDateTime;

@Entity
@Table(name = "rewards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer pointsCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private Partner partner;

    private Integer quantity;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    private LocalDateTime availableFrom;

    private LocalDateTime availableUntil;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
