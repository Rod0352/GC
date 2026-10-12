import { createContext, use } from 'react'
import type { Activity } from './api.ts'

export const PNTS = 'Prefer not to say'
export const ISSUES = [
  'Housing',
  'Economy',
  'Healthcare',
  'Veterans',
  'Education',
  'Immigration',
  'Climate',
  'Public safety',
  'Taxes',
  'Tech',
]

// Every field is a string or string[] so forms can be read generically (see collect).
export const initial = {
  firstName: '',
  middleInitial: '',
  lastName: '',
  id: '',
  recovering: '',
  recovery: '',
  accountType: '',
  /** Which of 'personal' and 'office' this account has finished setting up, and the one in use. */
  contexts: [] as string[],
  context: '',
  // personal
  citizenship: '',
  lives: '',
  street: '',
  unit: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  connection: '',
  lastState: '',
  lastZip: '',
  dob: '',
  gender: PNTS,
  race: [] as string[],
  education: '',
  employment: '',
  industry: '',
  income: '',
  housing: '',
  household: '',
  children: '',
  military: '',
  religion: '',
  party: '',
  strength: '',
  ideology: '',
  engagement: '',
  votingFrequency: '',
  elections: [] as string[],
  news: '',
  participation: [] as string[],
  issues: [] as string[],
  // Confirmed defaults: these three on; advertising and third-party use off.
  uses: ['Personalization', 'Civic research', 'Aggregated analytics'],
  visible: ['Display name + district'],
  // government
  govEmail: '',
  office: '',
  officePhone: '',
  level: 'Federal',
  branch: '',
  member: '',
  workspace: '',
  role: '',
  title: '',
  roleLevel: '',
  identity: '',
}
export type Data = typeof initial

export const STEPS = [
  'welcome', 'create-account', 'verify', 'sign-in', 'recovery', 'account-type',
  'classification', 'address', 'abroad', 'jurisdiction', 'demographics', 'political', 'civic', 'privacy', 'review',
  'gov-account', 'gov-office', 'gov-role', 'gov-verify', 'gov-approval', 'gov-review', 'enter-workspace',
  'home', 'government', 'legislation', 'community', 'messages', 'office',
] as const
export type Step = (typeof STEPS)[number]

/** Where each step leads, per the GC Sign-In Flows spec (sections 6-13). */
export function next(step: Step, d: Data): Step {
  switch (step) {
    case 'create-account':
    case 'recovery':
      return 'verify'
    case 'verify':
      return d.recovering ? 'sign-in' : 'account-type'
    case 'account-type':
      return d.accountType === 'government' ? 'gov-account' : 'classification'
    case 'classification':
      return d.lives === 'abroad' ? 'abroad' : 'address'
    case 'address':
      return 'jurisdiction'
    case 'abroad':
    case 'jurisdiction':
      return 'demographics'
    case 'demographics':
      return 'political'
    case 'political':
      return 'civic'
    case 'civic':
      return 'privacy'
    case 'privacy':
      return 'review'
    case 'gov-account':
      return 'gov-office'
    case 'gov-office':
      return 'gov-role'
    case 'gov-role':
      return 'gov-verify'
    case 'gov-verify':
      return d.role === 'staff' ? 'gov-approval' : 'gov-review'
    case 'gov-approval':
      return 'gov-review'
    case 'gov-review':
      return 'enter-workspace'
    default:
      return 'home'
  }
}

const MODULES: Record<string, string> = {
  citizen: 'Citizen · U.S. address',
  'permanent-resident': 'Permanent Resident',
  'other-resident': 'Other U.S. Resident',
  'non-citizen': 'Foreigner · U.S. address',
}

/** The six personal modules in the spec, resolved from two answers. */
export function moduleOf(d: Data) {
  if (d.lives === 'abroad')
    return d.connection === 'citizen'
      ? { name: 'Citizen · Abroad', observer: false }
      : { name: 'Observer · outside the U.S.', observer: true }
  return { name: MODULES[d.citizenship] || MODULES.citizen, observer: false }
}

const parse = (dob: string) => new Date(`${dob}T00:00`)

export function age(dob: string, now = new Date()) {
  const b = parse(dob)
  const hadBirthday = now >= new Date(now.getFullYear(), b.getMonth(), b.getDate())
  return now.getFullYear() - b.getFullYear() - (hadBirthday ? 0 : 1)
}

export function ageBand(a: number) {
  if (a < 18) return 'under 18'
  if (a >= 65) return '65+'
  const lo = a < 25 ? 18 : Math.floor((a - 5) / 10) * 10 + 5
  return `${lo}–${a < 25 ? 24 : lo + 9}`
}

export function eighteenth(dob: string) {
  const b = parse(dob)
  return new Date(b.getFullYear() + 18, b.getMonth(), b.getDate()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Reads every named control in a form. Checkbox groups become arrays that keep the order things were picked in. */
export function collect(form: HTMLFormElement, prev: Data): Partial<Data> {
  const fd = new FormData(form)
  const out: Record<string, string | string[]> = {}
  for (const el of form.elements) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.name) continue
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      const picked = fd.getAll(el.name) as string[]
      const old = prev[el.name as keyof Data] as string[]
      out[el.name] = [...old.filter((v) => picked.includes(v)), ...picked.filter((v) => !old.includes(v))]
    } else out[el.name] = String(fd.get(el.name) ?? '')
  }
  return out as Partial<Data>
}

/** Name as entered at sign-up. Others only ever see first name and last initial ("Ivan R."). */
export function person(d: Data) {
  const { firstName, middleInitial, lastName } = d
  return {
    full: [firstName, middleInitial && `${middleInitial.toUpperCase()}.`, lastName].filter(Boolean).join(' '),
    display: lastName ? `${firstName} ${lastName[0].toUpperCase()}.` : firstName,
    initials: firstName && lastName ? (firstName[0] + lastName[0]).toUpperCase() : undefined,
  }
}

/** Staff act on permissions an office administrator delegates; officials hold them outright (Access Matrix section I). */
export const delegated = (d: Data) => d.role !== 'elected' && d.role !== 'official'

export const roleLine = (d: Data) =>
  [{ elected: 'Elected official', official: 'Government official' }[d.role] ?? 'Staff', d.title].filter(Boolean).join(' · ')

export type Flow = {
  data: Data
  set: (patch: Partial<Data>) => void
  /** Saves the patch and moves to the next step. */
  submit: (patch?: Partial<Data>) => void
  /** URL segments after the step: `#legislation/hr-2041` gives `['hr-2041']`. */
  path: string[]
  me: Activity
  act: (patch: Partial<Activity>) => void
  /** Replaces the whole session: an account signing in, or nothing on sign-out. */
  load: (data?: Partial<Data>, activity?: Partial<Activity>) => void
}
export const FlowContext = createContext<Flow>(null!)
export const useFlow = () => use(FlowContext)
