import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

// --- getToolLabel unit tests (pure function) ---

describe("getToolLabel", () => {
  describe("str_replace_editor", () => {
    it("create in-progress", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/Card.jsx" }, false)).toBe("Creating Card.jsx");
    });
    it("create done", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/Card.jsx" }, true)).toBe("Created Card.jsx");
    });
    it("str_replace in-progress", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, false)).toBe("Editing App.jsx");
    });
    it("str_replace done", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, true)).toBe("Edited App.jsx");
    });
    it("insert in-progress", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, false)).toBe("Editing App.jsx");
    });
    it("insert done", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, true)).toBe("Edited App.jsx");
    });
    it("view in-progress", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/utils.ts" }, false)).toBe("Reading utils.ts");
    });
    it("view done", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/utils.ts" }, true)).toBe("Read utils.ts");
    });
  });

  describe("file_manager", () => {
    it("rename in-progress", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/App.jsx", new_path: "/NewApp.jsx" }, false)).toBe("Renaming App.jsx");
    });
    it("rename done", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/App.jsx", new_path: "/NewApp.jsx" }, true)).toBe("Renamed App.jsx → NewApp.jsx");
    });
    it("delete in-progress", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" }, false)).toBe("Deleting old.jsx");
    });
    it("delete done", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" }, true)).toBe("Deleted old.jsx");
    });
  });

  describe("unknown tool", () => {
    it("replaces underscores with spaces", () => {
      expect(getToolLabel("some_unknown_tool", {}, false)).toBe("some unknown tool");
    });
    it("same result when done", () => {
      expect(getToolLabel("some_unknown_tool", {}, true)).toBe("some unknown tool");
    });
  });
});

// --- ToolInvocationBadge render tests ---

describe("ToolInvocationBadge", () => {
  it("shows spinner and 'Creating Card.jsx' when in-progress", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "create", path: "/src/Card.jsx" }, state: "call" };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Creating Card.jsx")).toBeDefined();
    // Spinner present (no green dot)
    expect(document.querySelector(".bg-emerald-500")).toBeNull();
  });

  it("shows green dot and 'Created Card.jsx' when done", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "create", path: "/src/Card.jsx" }, state: "result", result: {} };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Created Card.jsx")).toBeDefined();
    expect(document.querySelector(".bg-emerald-500")).not.toBeNull();
  });

  it("shows 'Editing App.jsx' for str_replace in-progress", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "str_replace", path: "/App.jsx" }, state: "call" };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Editing App.jsx")).toBeDefined();
  });

  it("shows 'Edited App.jsx' for str_replace done", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "str_replace", path: "/App.jsx" }, state: "result", result: {} };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Edited App.jsx")).toBeDefined();
  });

  it("shows 'Reading utils.ts' for view in-progress", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "view", path: "/src/utils.ts" }, state: "call" };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Reading utils.ts")).toBeDefined();
  });

  it("shows 'Read utils.ts' for view done", () => {
    const inv = { toolName: "str_replace_editor", args: { command: "view", path: "/src/utils.ts" }, state: "result", result: {} };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Read utils.ts")).toBeDefined();
  });

  it("shows 'Renamed App.jsx → NewApp.jsx' for rename done", () => {
    const inv = { toolName: "file_manager", args: { command: "rename", path: "/App.jsx", new_path: "/NewApp.jsx" }, state: "result", result: {} };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Renamed App.jsx → NewApp.jsx")).toBeDefined();
  });

  it("shows 'Deleting old.jsx' for delete in-progress", () => {
    const inv = { toolName: "file_manager", args: { command: "delete", path: "/old.jsx" }, state: "call" };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Deleting old.jsx")).toBeDefined();
  });

  it("shows 'Deleted old.jsx' for delete done", () => {
    const inv = { toolName: "file_manager", args: { command: "delete", path: "/old.jsx" }, state: "result", result: {} };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("Deleted old.jsx")).toBeDefined();
  });

  it("falls back to spaced tool name for unknown tools", () => {
    const inv = { toolName: "some_unknown_tool", args: {}, state: "call" };
    render(<ToolInvocationBadge toolInvocation={inv} />);
    expect(screen.getByText("some unknown tool")).toBeDefined();
  });
});
