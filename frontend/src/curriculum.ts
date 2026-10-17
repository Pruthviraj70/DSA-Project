import data from "../../content/curriculum.json";
import { modules as runtimeModules, initialInput } from "./registry";
import type { Input } from "./protocol";
export interface Slide {
  id: string;
  title: string;
  kind: string;
  teaches: string[];
  paragraphs: string[];
  bullets?: string[];
  exampleId?: string;
  related?: { moduleId: string; label: string }[];
  visual?: string;
  runtime?: {
    moduleId: string;
    op: number;
    arg?: number;
    index?: number;
    values?: number[];
  };
  faqs?: { question: string; answer: string }[];
}
export interface LessonModule {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  prerequisites: string[];
  slides: Slide[];
}
export const lessons: LessonModule[] = data.modules;
export const aliases: Record<string, { moduleId: string; slideId: string }> =
  data.aliases;
export const lessonById = (id: string) => lessons.find((m) => m.id === id);
export const runtimeById = (id: string) =>
  runtimeModules.find((m) => m.id === id);
export function inputForSlide(slide: Slide): Input | undefined {
  if (!slide.runtime) return;
  const module = runtimeById(slide.runtime.moduleId);
  if (!module) return;
  return {
    ...initialInput(module),
    op: slide.runtime.op,
    ...(slide.runtime.arg !== undefined ? { arg: slide.runtime.arg } : {}),
    ...(slide.runtime.index !== undefined
      ? { index: slide.runtime.index }
      : {}),
    ...(slide.runtime.values ? { values: slide.runtime.values } : {}),
  };
}
export function slideForExperiment(input: Input) {
  for (const module of lessons) {
    const matches = module.slides.filter(
      (s) =>
        s.runtime &&
        runtimeById(s.runtime.moduleId)?.engineId === input.module &&
        s.runtime.op === input.op,
    );
    const slide =
      matches.find((s) => s.runtime?.arg === input.arg) ?? matches[0];
    if (slide) return { moduleId: module.id, slideId: slide.id };
  }
  return input.module === 11
    ? { moduleId: "graph", slideId: "edit" }
    : undefined;
}
export function prerequisites(id: string): LessonModule[] {
  const seen = new Set<string>();
  function visit(key: string) {
    for (const pre of lessonById(key)?.prerequisites ?? [])
      if (!seen.has(pre)) {
        seen.add(pre);
        visit(pre);
      }
  }
  visit(id);
  return lessons.filter((m) => seen.has(m.id));
}
export function reviewFor(concepts: string[]) {
  return lessons.flatMap((m) =>
    m.slides
      .filter((s) => s.teaches.some((c) => concepts.includes(c)))
      .map((s) => ({ moduleId: m.id, slideId: s.id, title: s.title })),
  );
}
export interface Location {
  page: "home" | "lesson" | "account" | "library" | "progress";
  moduleId?: string;
  slideId?: string;
}
export function lessonHref(moduleId: string, slideId: string) {
  return `#/lesson/${encodeURIComponent(moduleId)}/${encodeURIComponent(slideId)}`;
}
export function parseLocation(hash: string): Location {
  const parts = hash
    .replace(/^#\/?/, "")
    .split("/")
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return "";
      }
    });
  if (parts[0] === "lesson" && parts[1]) {
    const alias = aliases[parts[1]],
      module = lessonById(alias?.moduleId ?? parts[1]);
    if (module) {
      const slideId = parts[2] ?? alias?.slideId;
      return {
        page: "lesson",
        moduleId: module.id,
        slideId: module.slides.some((s) => s.id === slideId)
          ? slideId
          : undefined,
      };
    }
  }
  return {
    page: ["account", "library", "progress"].includes(parts[0])
      ? (parts[0] as Location["page"])
      : "home",
  };
}
