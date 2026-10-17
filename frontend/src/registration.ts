export function registrationErrors(password: string, confirmation: string) {
  return {
    password:
      password.length < 5
        ? "Password must be at least 5 characters."
        : password.length > 72 || new TextEncoder().encode(password).length > 72
          ? "Password must be at most 72 UTF-8 bytes."
          : "",
    confirmation:
      confirmation !== password
        ? "Passwords do not match."
        : !confirmation
          ? "Confirm your password."
          : "",
  };
}
