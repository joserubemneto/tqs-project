package ua.tqs.exception;

public class RewardNotFoundException extends RuntimeException {
    public RewardNotFoundException(String message) {
        super(message);
    }

    public RewardNotFoundException(Long rewardId) {
        super("Reward not found with id: " + rewardId);
    }
}
