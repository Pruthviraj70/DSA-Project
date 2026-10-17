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
  "pointer-update": "Update a pointer",
  hash: "Calculate a bucket",
  probe: "Follow a probe",
  rehash: "Grow the table",
  call: "Enter a call",
  return: "Return from a call",
  "window-expand": "Expand the window",
  "window-shrink": "Shrink the window",
  relax: "Improve a distance",
  complete: "Finish",
};
