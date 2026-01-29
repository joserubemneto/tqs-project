package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.enums.UserRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private Long id;
    private String email;
    private String name;
    private UserRole role;
    private String token;

    public static AuthResponse of(Long id, String email, String name, UserRole role, String token) {
        return AuthResponse.builder()
                .id(id)
                .email(email)
                .name(name)
                .role(role)
                .token(token)
                .build();
    }
}
