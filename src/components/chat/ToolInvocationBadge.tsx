"use client";
import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, any>;
  state: string;
  result?: unknown;
}

function basename(path: string): string {
  return path?.split("/").pop() ?? path;
}

export function getToolLabel(toolName: string, args: Record<string, any>, isDone: boolean): string {
  const file = basename(args?.path ?? "");
  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":      return isDone ? `Created ${file}`  : `Creating ${file}`;
      case "str_replace": return isDone ? `Edited ${file}`   : `Editing ${file}`;
      case "insert":      return isDone ? `Edited ${file}`   : `Editing ${file}`;
      case "view":        return isDone ? `Read ${file}`     : `Reading ${file}`;
    }
  }
  if (toolName === "file_manager") {
    const newFile = basename(args?.new_path ?? "");
    switch (args?.command) {
      case "rename": return isDone ? `Renamed ${file} → ${newFile}` : `Renaming ${file}`;
      case "delete": return isDone ? `Deleted ${file}`               : `Deleting ${file}`;
    }
  }
  return toolName.replace(/_/g, " ");
}

export function ToolInvocationBadge({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const { toolName, args, state, result } = toolInvocation;
  const isDone = state === "result" && !!result;
  const label = getToolLabel(toolName, args, isDone);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
