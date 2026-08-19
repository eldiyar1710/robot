export type RobotCommandName =
  | "connect"
  | "setMode"
  | "raiseArm"
  | "lowerArm"
  | "sit"
  | "stand"
  | "squat"
  | "wave"
  | "bow"
  | "greet"
  | "dance"
  | "clap"
  | "nod"
  | "shakeHead"
  | "walk"
  | "lean"
  | "reach"
  | "rotateWaist";

export type StepRequirement =
  | { type: "call"; name: RobotCommandName }
  | { type: "callWithArg"; name: RobotCommandName; arg: string };

export type LessonStep = {
  id: string;
  title: string;
  goal: string;
  instructions: string[];
  hint?: string;
  starterCode: string;
  solutionCode: string;
  requirements: StepRequirement[];
};

export type Lesson = {
  id: string;
  title: string;
  steps: LessonStep[];
};

export type Track = {
  id: string;
  title: string;
  subtitle: string;
  level: "beginner" | "intermediate" | "advanced";
  lessons: Lesson[];
};

const stepCodeShell = (body: string) => {
  return `async function run(robot) {\n${body}\n}\n\nrun(robot);`;
};

export const tracks: Track[] = [
  {
    id: "base",
    title: "База управления",
            subtitle: "Подключение → режимы → первые команды. Нужна база кода: функции, аргументы, порядок.",
    level: "beginner",
    lessons: [
      {
        id: "boot",
        title: "Запуск и базовые режимы",
        steps: [
          {
            id: "connect",
            title: "Шаг 1: Подключить робота",
            goal: "Научиться начинать сессию и убедиться, что робот «онлайн».",
            instructions: [
              "G1 — гуманоид Unitree (официально 23–43 DoF). В симуляторе вы учите логику SDK, а не физику батареи.",
              "Нужно знать базу кода: функция, аргумент, порядок строк, await.",
              "В коде вызови robot.connect()",
              "Нажми Run (Ctrl+Enter) и убедись, что справа статус стал CONNECTED",
            ],
            hint: "connect() — всегда первый вызов перед любыми командами движения.",
            starterCode: stepCodeShell(`  await robot.connect();`),
            solutionCode: stepCodeShell(`  await robot.connect();`),
            requirements: [{ type: "call", name: "connect" }],
          },
          {
            id: "manual-mode",
            title: "Шаг 2: Переключить на ручной режим",
            goal: "Понять, как меняется режим управления.",
            instructions: [
              "Сначала подключись: robot.connect()",
              'Потом установи режим: robot.setMode("manual")',
            ],
            hint: 'Доступные режимы: "idle", "manual", "auto".',
            starterCode: stepCodeShell(`  await robot.connect();\n  await robot.setMode("manual");`),
            solutionCode: stepCodeShell(`  await robot.connect();\n  await robot.setMode("manual");`),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
            ],
          },
          {
            id: "raise-left-arm",
            title: "Шаг 3: Поднять левую руку",
            goal: "Сделать первое движение в симуляции с правильным режимом.",
            instructions: [
              "Подключись и включи ручной режим",
              'Вызови: robot.raiseArm("left")',
            ],
            hint: 'Стороны: "left" или "right".',
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("left");`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("left");`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "callWithArg", name: "raiseArm", arg: "left" },
            ],
          },
          {
            id: "sit",
            title: "Шаг 4: Посадить робота",
            goal: "Понять разницу между позами sit/stand.",
            instructions: [
              "Подключись",
              'Переключи режим: robot.setMode("manual")',
              "Вызови: robot.sit()",
            ],
            starterCode: stepCodeShell(`  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();`),
            solutionCode: stepCodeShell(`  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();`),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "call", name: "sit" },
            ],
          },
          {
            id: "stand",
            title: "Шаг 5: Поднять робота",
            goal: "Вернуть робота в стоячую позу после sit().",
            instructions: [
              "Подключись и включи manual",
              "Посади: robot.sit()",
              "Подними: robot.stand()",
            ],
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();\n  await robot.stand();`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();\n  await robot.stand();`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "call", name: "sit" },
              { type: "call", name: "stand" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "manipulation",
    title: "Манипуляции",
    subtitle: "Обе руки, последовательности, auto-режим",
    level: "intermediate",
    lessons: [
      {
        id: "arms",
        title: "Работа с руками",
        steps: [
          {
            id: "raise-right-arm",
            title: "Шаг 1: Поднять правую руку",
            goal: "Освоить управление второй рукой.",
            instructions: [
              "Подключись и включи manual",
              'Вызови: robot.raiseArm("right")',
            ],
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("right");`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("right");`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "callWithArg", name: "raiseArm", arg: "right" },
            ],
          },
          {
            id: "both-arms",
            title: "Шаг 2: Обе руки",
            goal: "Выполнить последовательность: левая, затем правая.",
            instructions: [
              "Подключись и включи manual",
              'Подними левую: robot.raiseArm("left")',
              'Подними правую: robot.raiseArm("right")',
            ],
            hint: "Порядок вызовов важен — проверка идёт сверху вниз.",
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "callWithArg", name: "raiseArm", arg: "left" },
              { type: "callWithArg", name: "raiseArm", arg: "right" },
            ],
          },
          {
            id: "auto-mode",
            title: "Шаг 3: Авто-режим",
            goal: "Переключиться в auto перед сценарием.",
            instructions: [
              "Подключись",
              'Установи auto: robot.setMode("auto")',
              'Подними левую руку: robot.raiseArm("left")',
            ],
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "auto" },
              { type: "callWithArg", name: "raiseArm", arg: "left" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tricks",
    title: "Трюки",
    subtitle: "Комбо-последовательности для практики",
    level: "advanced",
    lessons: [
      {
        id: "combo",
        title: "Комбо-сценарии",
        steps: [
          {
            id: "salute",
            title: "Шаг 1: «Салют»",
            goal: "Поднять обе руки в auto-режиме.",
            instructions: [
              "Подключись",
              'robot.setMode("auto")',
              'robot.raiseArm("left")',
              'robot.raiseArm("right")',
            ],
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "auto" },
              { type: "callWithArg", name: "raiseArm", arg: "left" },
              { type: "callWithArg", name: "raiseArm", arg: "right" },
            ],
          },
          {
            id: "sit-stand-combo",
            title: "Шаг 2: Приседание",
            goal: "Полный цикл: sit → stand.",
            instructions: [
              "Подключись, manual",
              "robot.sit()",
              "robot.stand()",
            ],
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();\n  await robot.stand();`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("manual");\n  await robot.sit();\n  await robot.stand();`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "manual" },
              { type: "call", name: "sit" },
              { type: "call", name: "stand" },
            ],
          },
          {
            id: "full-routine",
            title: "Шаг 3: Полный сценарий",
            goal: "Финальный трюк: руки + приседание + вставание.",
            instructions: [
              "Подключись, auto",
              'Подними обе руки',
              "sit(), затем stand()",
            ],
            hint: "Это финальный шаг трека — после него доступен сертификат.",
            starterCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");\n  await robot.sit();\n  await robot.stand();`,
            ),
            solutionCode: stepCodeShell(
              `  await robot.connect();\n  await robot.setMode("auto");\n  await robot.raiseArm("left");\n  await robot.raiseArm("right");\n  await robot.sit();\n  await robot.stand();`,
            ),
            requirements: [
              { type: "call", name: "connect" },
              { type: "callWithArg", name: "setMode", arg: "auto" },
              { type: "callWithArg", name: "raiseArm", arg: "left" },
              { type: "callWithArg", name: "raiseArm", arg: "right" },
              { type: "call", name: "sit" },
              { type: "call", name: "stand" },
            ],
          },
        ],
      },
    ],
  },
];
