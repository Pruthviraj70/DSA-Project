export function learnerMessage(
  error: unknown,
  fallback = "The visualization could not start. Check the input and try Run again.",
): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /\bengine\b|wasm|webassembly|worker|protocol|\bcsrf\b|jdbc|flyway|event budget|already started|unknown module|v\d+\.\d+/i.test(
      message,
    )
  ) {
    console.error("Internal diagnostic:", error);
    return fallback;
  }
  return message;
}
export const actionLabels: Record<string, string> = {
  ready: "Ready",
  compare: "Compare values",
  swap: "Swap values",
  read: "Read a value",
  write: "Write a value",
  insert: "Insert",
  delete: "Remove",
  visit: "Visit",
  enqueue: "Join the queue / path",
  dequeue: "Leave the queue / path",
  "pointer-update": "Relink nodes",
  relax: "Improve a distance",
  complete: "Finish",
};
