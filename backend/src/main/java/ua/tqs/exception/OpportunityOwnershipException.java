package ua.tqs.exception;

/**
 * Exception thrown when a user tries to modify an opportunity they don't own.
 * Only the promoter who created the opportunity or an admin can modify it.
 */
public class OpportunityOwnershipException extends RuntimeException {
    public OpportunityOwnershipException(String message) {
        super(message);
    }

    public OpportunityOwnershipException() {
        super("Access denied");
    }
}
