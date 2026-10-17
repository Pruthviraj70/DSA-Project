package org.dsalab;

public class ApiException extends RuntimeException {
  final int status;
  final String code;

  public ApiException(int status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  public static ApiException missing() {
    return new ApiException(404, "not_found", "Record not found");
  }
}
