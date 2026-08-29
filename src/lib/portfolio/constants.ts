export const statusLabels = {
  active: '公開中',
  wip: '開発中',
  paused: '更新停止中',
  archived: '旧版',
} as const;

export type WorkStatus = keyof typeof statusLabels;
