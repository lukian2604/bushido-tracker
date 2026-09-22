export const HABIT_COLOR_PRESETS = ['#c9a24b', '#3b7fc4', '#8f6fd1', '#3fa9a0', '#c2607a', '#3a9d72', '#c9773f']

export const colorForHabitIndex = (index: number) => HABIT_COLOR_PRESETS[index % HABIT_COLOR_PRESETS.length]
