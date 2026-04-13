#!/usr/bin/env -S node --no-warnings
// docs/ 하위 drift 감지: stale 문서, 깨진 경로 참조, CLAUDE.md 길이.
// 사용: npx tsx scripts/drift-detector.ts  (또는 node --import tsx/esm)
// CI는 주간 스케줄로 실행.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(__dirname, '..')
const DOCS = join(ROOT, 'docs')
const TODAY = new Date()
const STALE_DAYS = 90
const CLAUDE_MD_MAX_LINES = 100

type Finding = { severity: 'warn' | 'error'; file: string; message: string }
const findings: Finding[] = []

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (entry.endsWith('.md') || entry.endsWith('.txt')) out.push(full)
  }
  return out
}

function parseFrontmatter(text: string): Record<string, string> | null {
  // 선행 HTML 주석 허용 (자동생성 파일 머리말 등)
  let body = text.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '')
  if (!body.startsWith('---')) return null
  const end = body.indexOf('\n---', 3)
  if (end < 0) return null
  const block = body.slice(4, end)
  const out: Record<string, string> = {}
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.+)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

function checkStaleness(file: string, fm: Record<string, string> | null) {
  if (!fm) {
    findings.push({ severity: 'warn', file, message: '프런트매터 누락' })
    return
  }
  const status = fm.verification_status
  if (status === 'stale') {
    findings.push({ severity: 'warn', file, message: 'verification_status=stale' })
  }
  const lv = fm.last_verified
  if (lv) {
    const d = new Date(lv)
    if (!isNaN(d.getTime())) {
      const ageDays = (TODAY.getTime() - d.getTime()) / 86400000
      if (ageDays > STALE_DAYS) {
        findings.push({
          severity: 'warn',
          file,
          message: `last_verified ${Math.floor(ageDays)}d > ${STALE_DAYS}d`,
        })
      }
    }
  }
}

function checkReferencedPaths(file: string, text: string) {
  // (a) relative md links: [..](./foo.md) or (../foo.md)
  const linkRe = /\]\((\.\/|\.\.\/)([^)\s]+)\)/g
  for (const m of text.matchAll(linkRe)) {
    const target = resolve(join(file, '..'), m[1] + m[2])
    if (!existsSync(target)) {
      findings.push({ severity: 'error', file, message: `깨진 링크: ${m[1]}${m[2]}` })
    }
  }
  // (b) src/... 경로 언급 — glob/placeholder 포함 시 스킵.
  const srcRe = /`(src\/[^`]+?\.[a-zA-Z]+)`/g
  for (const m of text.matchAll(srcRe)) {
    const ref = m[1]
    if (/[*<>{}]/.test(ref)) continue // glob/pattern/placeholder
    const target = join(ROOT, ref)
    if (!existsSync(target)) {
      findings.push({ severity: 'warn', file, message: `참조된 경로 없음: ${ref}` })
    }
  }
}

function checkRootClaudeMd() {
  const p = join(ROOT, 'CLAUDE.md')
  if (!existsSync(p)) return
  const lines = readFileSync(p, 'utf8').split('\n').length
  if (lines > CLAUDE_MD_MAX_LINES) {
    findings.push({
      severity: 'error',
      file: p,
      message: `CLAUDE.md ${lines}줄 > ${CLAUDE_MD_MAX_LINES}줄. 목차만 유지하세요.`,
    })
  }
}

function main() {
  checkRootClaudeMd()
  if (!existsSync(DOCS)) return
  for (const file of walk(DOCS)) {
    const text = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(text)
    checkStaleness(file, fm)
    checkReferencedPaths(file, text)
  }

  const errors = findings.filter((f) => f.severity === 'error')
  const warns = findings.filter((f) => f.severity === 'warn')

  for (const f of findings) {
    const rel = relative(ROOT, f.file)
    const label = f.severity === 'error' ? 'ERROR' : 'WARN '
    console.log(`${label}  ${rel}: ${f.message}`)
  }
  console.log(`\n총 ${errors.length} errors, ${warns.length} warnings`)
  if (errors.length > 0) process.exit(1)
}

main()
