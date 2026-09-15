package com.hemoconnect.service;

import com.hemoconnect.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private FirebaseService firebaseService;

    public List<Notification> getAllNotifications() throws Exception {
        return firebaseService.getAllNotifications();
    }

    public Notification createNotification(Notification notification) throws Exception {
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(System.currentTimeMillis());
        }
        return firebaseService.saveNotification(notification);
    }

    public void sendEmailNotification(String email, String subject, String messageContent) {
        // Taha Jaffri Rule 9: Log internally with full context
        System.out.println("[NotificationService] [SIMULATED EMAIL DISPATCH]");
        System.out.println("To: " + email);
        System.out.println("Subject: " + subject);
        System.out.println("Body: " + messageContent);
        System.out.println("[NotificationService] Dispatch successful.");
    }
}
