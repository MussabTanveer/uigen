"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: Record<string, any>;
    state: string;
    result?: any;
  };
}

function getBasename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function getToolLabel(toolName: string, args: Record<string, any>): string {
  if (toolName === "str_replace_editor") {
    if (!args.path) return toolName;
    const filename = getBasename(args.path);
    switch (args.command) {
      case "create":     return `Creating ${filename}`;
      case "str_replace":
      case "insert":     return `Editing ${filename}`;
      case "view":       return `Viewing ${filename}`;
      case "undo_edit":  return `Undoing edit in ${filename}`;
      default:           return toolName;
    }
  }

  if (toolName === "file_manager") {
    if (!args.path) return toolName;
    const filename = getBasename(args.path);
    switch (args.command) {
      case "delete": return `Deleting ${filename}`;
      case "rename": {
        const newFilename = args.new_path ? getBasename(args.new_path) : null;
        return newFilename ? `Renaming ${filename} → ${newFilename}` : `Renaming ${filename}`;
      }
      default: return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
