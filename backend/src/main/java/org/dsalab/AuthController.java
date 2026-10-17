package org.dsalab;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  final UserRepository users;
  final PasswordEncoder encoder;
  final AuthenticationManager manager;
  final SecurityContextRepository contexts;
  final JdbcTemplate jdbc;

  AuthController(
      UserRepository users,
      PasswordEncoder encoder,
      AuthenticationManager manager,
      SecurityContextRepository contexts,
      JdbcTemplate jdbc) {
    this.users = users;
    this.encoder = encoder;
    this.manager = manager;
    this.contexts = contexts;
    this.jdbc = jdbc;
  }

  record Login(
      @NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) {}

  record Register(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 12, max = 72) String password,
      @NotBlank @Size(max = 80) String displayName) {}

  @GetMapping("/csrf")
  Object csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @GetMapping("/me")
  Object me(Authentication auth) {
    return auth == null ? Map.of("authenticated", false) : view(find(auth));
  }

  LabUser find(Authentication auth) {
    return users.findByEmail(auth.getName()).orElseThrow(ApiException::missing);
  }

  static Object view(LabUser u) {
    return Map.of(
        "authenticated",
        true,
        "id",
        u.getId(),
        "email",
        u.getEmail(),
        "displayName",
        u.getDisplayName());
  }

  @PostMapping("/register")
  @Transactional
  Object register(
      @Valid @RequestBody Register input,
      HttpServletRequest request,
      HttpServletResponse response) {
    if (input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ApiException(400, "validation", "Password must be at most 72 UTF-8 bytes");
    LabUser u = new LabUser();
    u.setEmail(input.email().trim().toLowerCase(Locale.ROOT));
    u.setDisplayName(input.displayName().trim());
    u.setPasswordHash(encoder.encode(input.password()));
    users.saveAndFlush(u);
    jdbc.update(
        "INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE name='STUDENT'",
        u.getId());
    // Authentication reads the newly inserted user within this transaction.
    return signIn(new Login(input.email(), input.password()), request, response);
  }

  @PostMapping("/login")
  Object login(
      @Valid @RequestBody Login input, HttpServletRequest request, HttpServletResponse response) {
    return signIn(input, request, response);
  }

  Object signIn(Login input, HttpServletRequest request, HttpServletResponse response) {
    Authentication authenticated =
        manager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(
                input.email().trim().toLowerCase(Locale.ROOT), input.password()));
    if (request.getSession(false) != null) request.changeSessionId();
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authenticated);
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    return view(find(authenticated));
  }
}
