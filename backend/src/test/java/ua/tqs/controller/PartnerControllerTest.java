package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.dto.PartnerResponse;
import ua.tqs.model.Partner;
import ua.tqs.repository.PartnerRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PartnerController.
 * 
 * Test Strategy:
 * - Uses mocked PartnerRepository to test controller logic in isolation
 * - Verifies correct response mapping from Partner entities to PartnerResponse DTOs
 * - Tests empty list and multiple partners scenarios
 */
@ExtendWith(MockitoExtension.class)
class PartnerControllerTest {

    @Mock
    private PartnerRepository partnerRepository;

    @InjectMocks
    private PartnerController partnerController;

    private Partner activePartner1;
    private Partner activePartner2;

    @BeforeEach
    void setUp() {
        activePartner1 = Partner.builder()
                .id(1L)
                .name("UA Cafeteria")
                .description("University cafeteria partner")
                .logoUrl("https://example.com/logo1.png")
                .website("https://cafeteria.ua.pt")
                .active(true)
                .build();
        // Simulate @PrePersist
        setCreatedAt(activePartner1, LocalDateTime.now().minusDays(10));

        activePartner2 = Partner.builder()
                .id(2L)
                .name("Campus Bookstore")
                .description("University bookstore")
                .logoUrl("https://example.com/logo2.png")
                .website("https://bookstore.ua.pt")
                .active(true)
                .build();
        setCreatedAt(activePartner2, LocalDateTime.now().minusDays(5));
    }

    private void setCreatedAt(Partner partner, LocalDateTime createdAt) {
        // Use reflection to set createdAt since it's set by @PrePersist
        try {
            var field = Partner.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(partner, createdAt);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Nested
    @DisplayName("getActivePartners")
    class GetActivePartnersTests {

        @Test
        @DisplayName("should return OK status")
        void shouldReturnOkStatus() {
            when(partnerRepository.findByActiveTrue()).thenReturn(Collections.emptyList());

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return empty list when no active partners exist")
        void shouldReturnEmptyListWhenNoActivePartners() {
            when(partnerRepository.findByActiveTrue()).thenReturn(Collections.emptyList());

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).isEmpty();
            verify(partnerRepository).findByActiveTrue();
        }

        @Test
        @DisplayName("should return single partner when one active partner exists")
        void shouldReturnSinglePartner() {
            when(partnerRepository.findByActiveTrue()).thenReturn(List.of(activePartner1));

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            
            PartnerResponse partnerResponse = response.getBody().get(0);
            assertThat(partnerResponse.getId()).isEqualTo(1L);
            assertThat(partnerResponse.getName()).isEqualTo("UA Cafeteria");
            assertThat(partnerResponse.getDescription()).isEqualTo("University cafeteria partner");
            assertThat(partnerResponse.getLogoUrl()).isEqualTo("https://example.com/logo1.png");
            assertThat(partnerResponse.getWebsite()).isEqualTo("https://cafeteria.ua.pt");
            assertThat(partnerResponse.getActive()).isTrue();
        }

        @Test
        @DisplayName("should return multiple partners when multiple active partners exist")
        void shouldReturnMultiplePartners() {
            when(partnerRepository.findByActiveTrue()).thenReturn(List.of(activePartner1, activePartner2));

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(2);
            assertThat(response.getBody())
                    .extracting(PartnerResponse::getName)
                    .containsExactly("UA Cafeteria", "Campus Bookstore");
        }

        @Test
        @DisplayName("should correctly map all partner fields to response")
        void shouldMapAllFieldsCorrectly() {
            when(partnerRepository.findByActiveTrue()).thenReturn(List.of(activePartner1));

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            PartnerResponse partnerResponse = response.getBody().get(0);
            assertThat(partnerResponse.getId()).isEqualTo(activePartner1.getId());
            assertThat(partnerResponse.getName()).isEqualTo(activePartner1.getName());
            assertThat(partnerResponse.getDescription()).isEqualTo(activePartner1.getDescription());
            assertThat(partnerResponse.getLogoUrl()).isEqualTo(activePartner1.getLogoUrl());
            assertThat(partnerResponse.getWebsite()).isEqualTo(activePartner1.getWebsite());
            assertThat(partnerResponse.getActive()).isEqualTo(activePartner1.getActive());
            assertThat(partnerResponse.getCreatedAt()).isEqualTo(activePartner1.getCreatedAt());
        }

        @Test
        @DisplayName("should call repository exactly once")
        void shouldCallRepositoryOnce() {
            when(partnerRepository.findByActiveTrue()).thenReturn(List.of(activePartner1));

            partnerController.getActivePartners();

            verify(partnerRepository, times(1)).findByActiveTrue();
            verifyNoMoreInteractions(partnerRepository);
        }

        @Test
        @DisplayName("should handle partner with null optional fields")
        void shouldHandlePartnerWithNullOptionalFields() {
            Partner partnerWithNulls = Partner.builder()
                    .id(3L)
                    .name("Minimal Partner")
                    .description(null)
                    .logoUrl(null)
                    .website(null)
                    .active(true)
                    .build();
            setCreatedAt(partnerWithNulls, LocalDateTime.now());

            when(partnerRepository.findByActiveTrue()).thenReturn(List.of(partnerWithNulls));

            ResponseEntity<List<PartnerResponse>> response = partnerController.getActivePartners();

            PartnerResponse partnerResponse = response.getBody().get(0);
            assertThat(partnerResponse.getName()).isEqualTo("Minimal Partner");
            assertThat(partnerResponse.getDescription()).isNull();
            assertThat(partnerResponse.getLogoUrl()).isNull();
            assertThat(partnerResponse.getWebsite()).isNull();
        }
    }
}
