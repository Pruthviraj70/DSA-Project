package org.dsalab;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class Errors {
  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> api(ApiException e) {
    return ResponseEntity.status(e.status).body(Map.of("code", e.code, "message", e.getMessage()));
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class,
    jakarta.validation.ConstraintViolationException.class
  })
  ResponseEntity<?> invalid(Exception e) {
    return ResponseEntity.badRequest()
        .body(
            Map.of(
                "code",
                "validation",
                "message",
                "Request contains missing, invalid, or unsupported fields"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict() {
    return ResponseEntity.status(409)
        .body(
            Map.of(
                "code",
                "conflict",
                "message",
                "A record with these details already exists or conflicts with related records"));
  }

  @ExceptionHandler(AuthenticationException.class)
  ResponseEntity<?> authentication() {
    return ResponseEntity.status(401)
        .body(Map.of("code", "authentication", "message", "Email or password is incorrect"));
  }

  @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
  ResponseEntity<?> notFound() {
    return ResponseEntity.status(404)
        .body(Map.of("code", "not_found", "message", "Endpoint not found"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected() {
    return ResponseEntity.status(500)
        .body(Map.of("code", "internal", "message", "Unexpected server error"));
  }
}
