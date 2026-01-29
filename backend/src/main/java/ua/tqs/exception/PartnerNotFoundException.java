package ua.tqs.exception;

public class PartnerNotFoundException extends RuntimeException {
    public PartnerNotFoundException(String message) {
        super(message);
    }

    public PartnerNotFoundException(Long partnerId) {
        super("Partner not found with id: " + partnerId);
    }
}
