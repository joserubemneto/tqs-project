package ua.tqs.exception;

public class OpportunityNotEndedException extends RuntimeException {
    public OpportunityNotEndedException(String message) {
        super(message);
    }

    public OpportunityNotEndedException() {
        super("Cannot complete application: opportunity has not ended yet");
    }
}
