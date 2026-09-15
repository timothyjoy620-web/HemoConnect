package com.hemoconnect.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class InputSanitizer {
    
    /**
     * Sanitizes a string input by removing all HTML tags and scripts.
     * Prevents Cross-Site Scripting (XSS) and other script injection payloads.
     *
     * @param input the raw string input
     * @return the safe sanitized string
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Safelist.none() strips all HTML markup completely
        return Jsoup.clean(input, Safelist.none()).trim();
    }
}
