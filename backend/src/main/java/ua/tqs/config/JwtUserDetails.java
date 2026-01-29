package ua.tqs.config;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class JwtUserDetails {
    private final Long userId;
    private final String email;
    private final String role;
}
