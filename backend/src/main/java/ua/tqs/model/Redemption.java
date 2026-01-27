package ua.tqs.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "redemptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Redemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private Integer pointsSpent;

    @Column(nullable = false, updatable = false)
    private LocalDateTime redeemedAt;

    private LocalDateTime usedAt;

    @PrePersist
    protected void onCreate() {
        redeemedAt = LocalDateTime.now();
        if (code == null) {
            code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
