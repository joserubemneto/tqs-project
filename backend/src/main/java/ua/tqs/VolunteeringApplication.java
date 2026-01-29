package ua.tqs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VolunteeringApplication {

    public static void main(String[] args) {
        SpringApplication.run(VolunteeringApplication.class, args);
    }
}
