package ua.tqs.exception;

/**
 * Exception thrown when a volunteer tries to apply to an opportunity they have already applied to.
 */
public class AlreadyAppliedException extends RuntimeException {
    public AlreadyAppliedException() {
        super("Already applied");
    }

    public AlreadyAppliedException(String message) {
        super(message);
    }
}
