package ua.tqs.exception;

public class InvalidApplicationStatusException extends RuntimeException {
    public InvalidApplicationStatusException(String message) {
        super(message);
    }
}
