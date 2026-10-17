import { describe, it, expect } from "vitest";
import { registrationErrors } from "./registration";
describe("registration passwords", () => {
  it("accepts five lowercase characters without composition rules", () => {
    expect(registrationErrors("abcde", "abcde")).toEqual({
      password: "",
      confirmation: "",
    });
  });
  it("uses the exact minimum message and rejects mismatches", () => {
    expect(registrationErrors("abcd", "abcd").password).toBe(
      "Password must be at least 5 characters.",
    );
    expect(registrationErrors("abcde", "abcdef").confirmation).toBe(
      "Passwords do not match.",
    );
  });
  it("retains the UTF-8 byte maximum", () => {
    expect(registrationErrors("a".repeat(72), "a".repeat(72)).password).toBe(
      "",
    );
    expect(
      registrationErrors("é".repeat(37), "é".repeat(37)).password,
    ).toContain("72");
  });
});
