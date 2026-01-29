package ua.tqs.exception;

public class ApplicationNotFoundException extends RuntimeException {
    public ApplicationNotFoundException(String message) {
        super(message);
    }

    public ApplicationNotFoundException(Long applicationId) {
        super("Application not found with id: " + applicationId);
    }
}
