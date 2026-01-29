package ua.tqs.exception;

/**
 * Exception thrown when an operation is not allowed due to the opportunity's current status.
 * For example, trying to edit a COMPLETED opportunity or cancel an IN_PROGRESS opportunity.
 */
public class OpportunityStatusException extends RuntimeException {
    public OpportunityStatusException(String message) {
        super(message);
    }
}
