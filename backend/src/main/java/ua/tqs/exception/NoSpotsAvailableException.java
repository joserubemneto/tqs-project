package ua.tqs.exception;

/**
 * Exception thrown when a volunteer tries to apply to an opportunity that has no available spots.
 */
public class NoSpotsAvailableException extends RuntimeException {
    public NoSpotsAvailableException() {
        super("No spots available");
    }

    public NoSpotsAvailableException(String message) {
        super(message);
    }
}
