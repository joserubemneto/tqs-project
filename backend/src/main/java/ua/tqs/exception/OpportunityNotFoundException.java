package ua.tqs.exception;

public class OpportunityNotFoundException extends RuntimeException {
    public OpportunityNotFoundException(String message) {
        super(message);
    }

    public OpportunityNotFoundException(Long opportunityId) {
        super("Opportunity not found with id: " + opportunityId);
    }
}
