import { describe, it, expect } from "vitest";
import { modules, initialInput, validate, registry } from "./registry";
import {
  lessons,
  inputForSlide,
  slideForExperiment,
  prerequisites,
} from "./curriculum";
import { parseValues } from "./Playground";
describe("released module contract", () => {
  it("binds twenty unique stable modules with complete learning content", () => {
    expect(registry.registryVersion).toBe(1);
    expect(modules).toHaveLength(20);
    expect(new Set(modules.map((m) => m.id)).size).toBe(20);
    for (const m of modules) {
      expect(["1.1.0", "1.2.0"]).toContain(m.version);
      expect(m.objectives.length).toBeGreaterThan(0);
      expect(m.example.length).toBeGreaterThan(15);
      expect(m.invariant.length).toBeGreaterThan(15);
      expect(m.operations.length).toBeGreaterThan(0);
      expect(validate(initialInput(m)), m.id).toBeUndefined();
      for (const pre of m.prerequisites)
        expect(modules.some((m) => m.id === pre)).toBe(true);
    }
  });
  it("rejects unsorted binary search, negative Dijkstra edges and invalid graph IDs", () => {
    expect(validate({ ...initialInput(modules[2]), values: [2, 1] })).toContain(
      "sorted",
    );
    expect(
      validate({
        ...initialInput(modules[13]),
        edges: [{ from: 0, to: 1, weight: -1 }],
      }),
    ).toContain("nonnegative");
    expect(
      validate({ ...initialInput(modules[10]), values: [1, 1] }),
    ).toContain("unique");
  });
  it("rejects fractional graph weights before crossing the C integer ABI", () => {
    expect(validate({ ...initialInput(modules[10]), weight: 1.5 })).toContain(
      "integers",
    );
    expect(
      validate({
        ...initialInput(modules[10]),
        edges: [{ from: 0, to: 9, weight: 1 }],
      }),
    ).toContain("endpoints");
  });
  it("enforces limits and avoids sharing mutable defaults", () => {
    const x = initialInput(modules[0]);
    x.values.push(9);
    expect(modules[0].defaultInput.values).toHaveLength(3);
    expect(validate({ ...x, values: Array(33).fill(0) })).toContain("32");
    expect(validate({ ...x, values: [1.2] })).toContain("integers");
  });
  it("parses empty, signed and duplicate inputs but rejects empty comma entries", () => {
    expect(parseValues("")).toEqual([]);
    expect(parseValues("-1,2,2")).toEqual([-1, 2, 2]);
    expect(() => parseValues("1,,2")).toThrow("empty");
  });
});

describe("lesson structure", () => {
  it("groups every runtime module once and finishes with FAQs and a quiz", () => {
    expect(lessons).toHaveLength(14);
    const covered = new Set<number>();
    for (const lesson of lessons) {
      expect(new Set(lesson.slides.map((s) => s.id)).size).toBe(
        lesson.slides.length,
      );
      expect(lesson.slides.at(-1)?.kind).toBe("quiz");
      expect(lesson.slides.at(-2)?.kind).toBe("faq");
      for (const slide of lesson.slides)
        if (slide.runtime) {
          const input = inputForSlide(slide)!;
          covered.add(input.module);
          expect(validate(input), `${lesson.id}/${slide.id}`).toBeUndefined();
          expect(Object.keys(input)).not.toContain("moduleId");
        }
    }
    expect([...covered].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });
  it("restores stable slides and maps legacy algorithms into grouped lessons", () => {
    expect(prerequisites("graph").map((m) => m.id)).toContain("foundations");
    expect(slideForExperiment({ ...initialInput(modules[0]), op: 3 })).toEqual({
      moduleId: "arrays",
      slideId: "insert",
    });
  });
});

describe("new operation prerequisites", () => {
  const input = (
    id: number,
    op: number,
    values: number[],
    arg = 0,
    index = 0,
  ) => ({
    ...initialInput(modules.find((m) => m.engineId === id)!),
    op,
    values,
    arg,
    index,
  });
  it("rejects incomplete hash pairs and preserves signed integer keys", () => {
    expect(validate(input(15, 0, [-1, 10, 7, 20]))).toBeUndefined();
    expect(validate(input(16, 0, [1, 10, 2]))).toContain("pairs");
  });
  it("keeps sortedness explicit for recursive search and two pointers", () => {
    expect(validate(input(18, 2, [3, 1]))).toContain("sorted");
    expect(validate(input(19, 0, [3, 1]))).toContain("sorted");
    expect(validate(input(19, 1, [3, 1]))).toBeUndefined();
  });
  it("separates fixed signed windows from nonnegative variable windows", () => {
    expect(validate(input(20, 0, [-5, -2, -8], 0, 2))).toBeUndefined();
    expect(validate(input(20, 0, [], 0, 1))).toContain("Window size");
    expect(validate(input(20, 1, [-1, 5], 5))).toContain("nonnegative");
    expect(validate(input(20, 1, [], 5))).toBeUndefined();
  });
  it("bounds branching recursion and factorial arithmetic", () => {
    expect(validate(input(18, 0, [], 13))).toContain("0..12");
    expect(validate(input(18, 3, [], 11))).toContain("0..10");
  });
});

it("rejects values that would wrap when crossing the integer input boundary", () => {
  const hash = initialInput(modules.find((m) => m.engineId === 16)!);
  expect(validate({ ...hash, op: 2, index: 4294967297 })).toContain("range");
});
