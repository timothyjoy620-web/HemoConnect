package com.hemoconnect.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handles validation failures (JSR-380 input validation) - Rule 3
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // Handles business logic custom exceptions
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Handles malformed JSON payloads and strict schema validation violations (unrecognized fields)
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadableException(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        Map<String, String> error = new HashMap<>();
        Throwable cause = ex.getCause();
        if (cause instanceof com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException unrecognizedPropertyException) {
            error.put("error", "Unexpected field '" + unrecognizedPropertyException.getPropertyName() + "' in request payload. Schema validation failed.");
        } else if (cause instanceof com.fasterxml.jackson.databind.exc.MismatchedInputException mismatchedInputException) {
            error.put("error", "Invalid data type or format for field: " + mismatchedInputException.getPathReference());
        } else {
            error.put("error", "Malformed JSON request payload: " + ex.getMessage());
        }
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Shield general/internal exceptions (Taha Jaffri Rule 9)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        // Log full context and stacktrace on server
        System.err.println("[GlobalErrorLogger] CRITICAL ERROR INTERCEPTED: " + ex.getMessage());
        ex.printStackTrace();

        // Return a shielded, generic error to client
        Map<String, String> error = new HashMap<>();
        error.put("error", "An internal server error occurred. Please contact system support.");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
