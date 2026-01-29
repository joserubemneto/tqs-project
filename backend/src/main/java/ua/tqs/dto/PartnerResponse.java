package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Partner;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerResponse {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String website;
    private Boolean active;
    private LocalDateTime createdAt;

    public static PartnerResponse fromPartner(Partner partner) {
        if (partner == null) {
            return null;
        }
        return PartnerResponse.builder()
                .id(partner.getId())
                .name(partner.getName())
                .description(partner.getDescription())
                .logoUrl(partner.getLogoUrl())
                .website(partner.getWebsite())
                .active(partner.getActive())
                .createdAt(partner.getCreatedAt())
                .build();
    }
}
