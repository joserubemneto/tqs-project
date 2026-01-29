package ua.tqs.exception;

public class SelfRoleChangeException extends RuntimeException {
    public SelfRoleChangeException() {
        super("Cannot change your own role");
    }

    public SelfRoleChangeException(String message) {
        super(message);
    }
}
