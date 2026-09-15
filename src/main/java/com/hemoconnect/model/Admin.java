package com.hemoconnect.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class Admin {
    private String id;
    
    @NotBlank(message = "Username/Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String role = "ADMIN";
    
    private Long timestamp;

    public Admin() {
    }

    public Admin(String id, String email, String name, String role, Long timestamp) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
