package ua.tqs.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        log.info("Health check requested");
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "UA Volunteering Platform",
            "timestamp", LocalDateTime.now()
        ));
    }
}
