import type { RobotCommandName, StepRequirement } from "@/content/tracks";
import type { RobotMode, Side } from "@/store/useRobotStore";
import { useRobotStore } from "@/store/useRobotStore";

export type ParsedRobotCall = {
  name: RobotCommandName;
  arg?: string;
  num?: number;
  raw: string;
};

const COMMANDS: RobotCommandName[] = [
  "connect",
  "setMode",
  "raiseArm",
  "lowerArm",
  "sit",
  "stand",
  "squat",
  "wave",
  "bow",
  "greet",
  "dance",
  "clap",
  "nod",
  "shakeHead",
  "walk",
  "lean",
  "reach",
  "rotateWaist",
];

const argFrom = (rawArgs: string) => {
  const m = rawArgs.match(/["']([^"']+)["']/);
  return m?.[1];
};

const numFrom = (rawArgs: string) => {
  const m = rawArgs.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

export function parseRobotCalls(code: string): ParsedRobotCall[] {
  const re = /robot\.(\w+)\(([^)]*)\)\s*;?/g;
  const out: ParsedRobotCall[] = [];
  for (const match of code.matchAll(re)) {
    const [, fn, rawArgs] = match;
    const name = fn as RobotCommandName;
    if (!COMMANDS.includes(name)) continue;
    out.push({ name, arg: argFrom(rawArgs ?? ""), num: numFrom(rawArgs ?? ""), raw: match[0] });
  }
  return out;
}

export function validateRequirements(calls: ParsedRobotCall[], reqs: StepRequirement[]) {
  const errors: string[] = [];
  let cursor = 0;

  for (const req of reqs) {
    const foundIndex = calls.findIndex((c, i) => i >= cursor && c.name === req.name);
    if (foundIndex === -1) {
      errors.push(`Не найден вызов: robot.${req.name}()`);
      continue;
    }

    if (req.type === "callWithArg") {
      const arg = calls[foundIndex]?.arg;
      if (arg !== req.arg) {
        errors.push(`Неверный аргумент для robot.${req.name}(): ожидалось "${req.arg}", получено "${arg ?? ""}"`);
      }
    }

    cursor = foundIndex + 1;
  }

  return { ok: errors.length === 0, errors };
}

export function callsToHumanList(calls: ParsedRobotCall[]) {
  return calls.map((c) => `robot.${c.name}(${c.arg ? JSON.stringify(c.arg) : c.num ?? ""})`).join(" → ");
}

export async function playCalls(
  calls: ParsedRobotCall[],
  api: {
    connect: () => Promise<void>;
    setMode: (mode: RobotMode) => Promise<void>;
    raiseArm: (side: Side) => Promise<void>;
    sit: () => Promise<void>;
    stand: () => Promise<void>;
  },
) {
  const robot = useRobotStore.getState();
  for (const c of calls) {
    const side = (c.arg as Side) ?? "left";
    if (c.name === "connect") await api.connect();
    else if (c.name === "setMode") await api.setMode((c.arg as RobotMode) ?? "idle");
    else if (c.name === "raiseArm") await api.raiseArm(side);
    else if (c.name === "lowerArm") await robot.lowerArm(side);
    else if (c.name === "sit") await api.sit();
    else if (c.name === "stand") await api.stand();
    else if (c.name === "squat") await robot.squat();
    else if (c.name === "wave") await robot.wave(side, c.num && c.num < 12 ? Math.round(c.num) : 3);
    else if (c.name === "bow") await robot.bow();
    else if (c.name === "greet") await robot.greet();
    else if (c.name === "dance") await robot.dance(c.num ?? 5);
    else if (c.name === "clap") await robot.handsClap(c.num ?? 3);
    else if (c.name === "nod") await robot.nod(c.num ?? 2);
    else if (c.name === "shakeHead") await robot.shakeHead(c.num ?? 2);
    else if (c.name === "walk") await robot.walkInPlace(c.num ?? 6);
    else if (c.name === "lean") await robot.leanSide(side);
    else if (c.name === "reach") await robot.reachForward(side);
    else if (c.name === "rotateWaist") await robot.rotateWaist(c.num ?? 20);
  }
}
