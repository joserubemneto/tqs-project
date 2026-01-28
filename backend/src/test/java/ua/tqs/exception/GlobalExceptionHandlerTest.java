package ua.tqs.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Nested
    @DisplayName("handleEmailAlreadyExists()")
    class HandleEmailAlreadyExists {

        @Test
        @DisplayName("should return CONFLICT status with error message")
        void shouldReturnConflictStatus() {
            EmailAlreadyExistsException exception = new EmailAlreadyExistsException("Email already registered");

            ResponseEntity<ErrorResponse> response = handler.handleEmailAlreadyExists(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(409);
            assertThat(response.getBody().getError()).isEqualTo("Conflict");
            assertThat(response.getBody().getMessage()).isEqualTo("Email already registered");
            assertThat(response.getBody().getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("should include exception message in response")
        void shouldIncludeExceptionMessage() {
            String customMessage = "test@ua.pt is already registered";
            EmailAlreadyExistsException exception = new EmailAlreadyExistsException(customMessage);

            ResponseEntity<ErrorResponse> response = handler.handleEmailAlreadyExists(exception);

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).isEqualTo(customMessage);
        }
    }

    @Nested
    @DisplayName("handleValidationExceptions()")
    class HandleValidationExceptions {

        @Test
        @DisplayName("should return BAD_REQUEST status with validation errors")
        void shouldReturnBadRequestWithValidationErrors() {
            MethodArgumentNotValidException exception = createValidationException(
                    List.of(
                            new FieldError("registerRequest", "email", "Email is required"),
                            new FieldError("registerRequest", "password", "Password must be at least 8 characters")
                    )
            );

            ResponseEntity<ErrorResponse> response = handler.handleValidationExceptions(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(400);
            assertThat(response.getBody().getError()).isEqualTo("Bad Request");
            assertThat(response.getBody().getValidationErrors()).isNotNull();
            assertThat(response.getBody().getValidationErrors()).containsEntry("email", "Email is required");
            assertThat(response.getBody().getValidationErrors()).containsEntry("password", "Password must be at least 8 characters");
        }

        @Test
        @DisplayName("should use first validation error as main message")
        void shouldUseFirstValidationErrorAsMainMessage() {
            MethodArgumentNotValidException exception = createValidationException(
                    List.of(
                            new FieldError("registerRequest", "name", "Name is required")
                    )
            );

            ResponseEntity<ErrorResponse> response = handler.handleValidationExceptions(exception);

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).isEqualTo("Name is required");
        }

        @Test
        @DisplayName("should return 'Validation failed' when no errors present")
        void shouldReturnDefaultMessageWhenNoErrors() {
            MethodArgumentNotValidException exception = createValidationException(List.of());

            ResponseEntity<ErrorResponse> response = handler.handleValidationExceptions(exception);

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).isEqualTo("Validation failed");
        }

        private MethodArgumentNotValidException createValidationException(List<FieldError> fieldErrors) {
            BindingResult bindingResult = mock(BindingResult.class);
            when(bindingResult.getAllErrors()).thenReturn(List.copyOf(fieldErrors));

            MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
            when(exception.getBindingResult()).thenReturn(bindingResult);

            return exception;
        }
    }

    @Nested
    @DisplayName("handleGenericException()")
    class HandleGenericException {

        @Test
        @DisplayName("should return INTERNAL_SERVER_ERROR status")
        void shouldReturnInternalServerError() {
            Exception exception = new RuntimeException("Something went wrong");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(500);
            assertThat(response.getBody().getError()).isEqualTo("Internal Server Error");
        }

        @Test
        @DisplayName("should return generic message without exposing internal details")
        void shouldReturnGenericMessage() {
            Exception exception = new RuntimeException("Sensitive database error details");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(exception);

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
            // Should NOT contain the actual exception message
            assertThat(response.getBody().getMessage()).doesNotContain("database");
        }

        @Test
        @DisplayName("should handle NullPointerException")
        void shouldHandleNullPointerException() {
            Exception exception = new NullPointerException("Null value");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getMessage()).isEqualTo("An unexpected error occurred");
        }

        @Test
        @DisplayName("should include timestamp in response")
        void shouldIncludeTimestamp() {
            Exception exception = new RuntimeException("Error");

            ResponseEntity<ErrorResponse> response = handler.handleGenericException(exception);

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getTimestamp()).isNotNull();
        }
    }
}
