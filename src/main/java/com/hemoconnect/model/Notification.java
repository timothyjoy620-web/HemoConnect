package com.hemoconnect.model;

public class Notification {
    private String id;
    private String message;
    private String type; // ALERT, REQUEST_STATUS, DONOR_MATCH, BROADCAST
    private String recipient; // Email/Phone or "ALL"
    private Long timestamp;

    public Notification() {
    }

    public Notification(String id, String message, String type, String recipient, Long timestamp) {
        this.id = id;
        this.message = message;
        this.type = type;
        this.recipient = recipient;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
