import { defineConfig } from 'vite-plus'
import { fmt } from './vite/fmt'
import { lint } from './vite/lint'
import { run } from './vite/tasks'
import { staged } from './vite/staged'

export default defineConfig({ fmt, lint, run, staged })
