import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

const ROBOT_API = [
  { label: "robot.connect()", insertText: "await robot.connect();", detail: "Подключиться к роботу" },
  { label: 'robot.setMode("manual")', insertText: 'await robot.setMode("manual");', detail: 'Режим: "idle" | "manual" | "auto"' },
  { label: 'robot.raiseArm("left")', insertText: 'await robot.raiseArm("left");', detail: 'Поднять руку: "left" | "right"' },
  { label: "robot.sit()", insertText: "await robot.sit();", detail: "Посадить робота" },
  { label: "robot.stand()", insertText: "await robot.stand();", detail: "Поднять робота" },
];

export function CodeEditor({
  value,
  onChange,
  height = 420,
  onRun,
}: {
  value: string;
  onChange: (v: string) => void;
  height?: number;
  onRun?: () => void;
}) {
  const handleMount: OnMount = (ed, monaco) => {
    ed.addAction({
      id: "run-code",
      label: "Run",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRun?.(),
    });

    monaco.languages.registerCompletionItemProvider("javascript", {
      triggerCharacters: ["."],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: ROBOT_API.map((item, i) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: item.insertText,
            detail: item.detail,
            range,
            sortText: String(i).padStart(3, "0"),
          })),
        };
      },
    });
  };

  return (
    <Editor
      height={height}
      theme="vs-dark"
      defaultLanguage="javascript"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "var(--font-code)",
        wordWrap: "on",
        scrollBeyondLastLine: false,
        tabSize: 2,
        renderLineHighlight: "all",
        quickSuggestions: true,
      }}
    />
  );
}

export type { editor };
