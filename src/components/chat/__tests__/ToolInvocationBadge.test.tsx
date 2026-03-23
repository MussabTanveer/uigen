import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state = "call",
  result?: any
) {
  return { toolCallId: "1", toolName, args, state, result };
}

// str_replace_editor labels
test("str_replace_editor create renders 'Creating {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/App.tsx" })} />);
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("str_replace_editor str_replace renders 'Editing {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "components/Button.tsx" })} />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("str_replace_editor insert renders 'Editing {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "lib/utils.ts" })} />);
  expect(screen.getByText("Editing utils.ts")).toBeDefined();
});

test("str_replace_editor view renders 'Viewing {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "index.tsx" })} />);
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit renders 'Undoing edit in {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "styles.css" })} />);
  expect(screen.getByText("Undoing edit in styles.css")).toBeDefined();
});

test("str_replace_editor unknown command falls back to toolName", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "unknown", path: "App.tsx" })} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// file_manager labels
test("file_manager delete renders 'Deleting {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/App.tsx" })} />);
  expect(screen.getByText("Deleting App.tsx")).toBeDefined();
});

test("file_manager rename renders 'Renaming {filename} → {new_filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "src/foo.ts", new_path: "src/bar.ts" })} />);
  expect(screen.getByText("Renaming foo.ts → bar.ts")).toBeDefined();
});

test("file_manager rename without new_path renders 'Renaming {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "src/foo.ts" })} />);
  expect(screen.getByText("Renaming foo.ts")).toBeDefined();
});

test("file_manager unknown command falls back to toolName", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "unknown", path: "App.tsx" })} />);
  expect(screen.getByText("file_manager")).toBeDefined();
});

// Unknown tool fallback
test("unknown toolName renders raw toolName", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("my_custom_tool", {})} />);
  expect(screen.getByText("my_custom_tool")).toBeDefined();
});

// Basename extraction
test("deep nested path shows only the filename", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "src/components/chat/MessageList.tsx" })} />);
  expect(screen.getByText("Editing MessageList.tsx")).toBeDefined();
});

// Pending state — spinner shown, no green dot
test("pending state (call) shows spinner", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.tsx" }, "call")} />);
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("pending state (partial-call) shows spinner", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.tsx" }, "partial-call")} />);
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("result state with undefined result still shows spinner", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.tsx" }, "result", undefined)} />);
  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Completed state — green dot shown, no spinner
test("result state with a result shows green dot and no spinner", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.tsx" }, "result", "ok")} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector("svg")).toBeNull();
});
