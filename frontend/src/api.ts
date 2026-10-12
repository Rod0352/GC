import { moduleOf, person, type Data } from './flow.ts'
import { STATES } from './places.ts'
import * as seed from './seed.ts'

// The only place screens get platform data from.
// shortcut: reads come straight from seed.ts and are synchronous; turn these into requests when a backend exists.

export type Member = { id: string; name: string; chamber: string; seat: string; office: string }
export type Jurisdiction = { zips: string[]; district: string; county: string; stateLeg: string; reps: string[] }
export type Bill = {
  id: string
  number: string
  title: string
  issue: string
  summary: string
  sponsor: string
  /** Index into STAGES. */
  stage: number
  actions: { at: number; text: string }[]
  /** Member id to that member's recorded vote. */
  votes: Record<string, string>
}
/** `on` says where it belongs: `member:<id>`, `bill:<id>`, `community:<id>` or `inquiry:<id>`. */
export type Post = { id: string; on: string; by: string; text: string; at: number; status?: 'pending' | 'published' }
export type Poll = { id: string; by: string; question: string; at: number; options: [label: string, votes: number][] }
export type Community = { id: string; name: string; about: string; members: number }
export type Inquiry = {
  id: string
  /** Member id of the office it is addressed to. */
  to: string
  /** Account that sent it. Offices only ever see `from`. */
  by: string
  from: string
  subject: string
  issue: string
  text: string
  at: number
  status: 'New' | 'In progress' | 'Answered'
}
export type Staff = { id: string; office: string; name: string; title: string; level: string; status: 'Active' | 'Pending' | 'Declined' }
export type Account = { label: string; data: Partial<Data> & { id: string }; activity?: Partial<Activity> }

/** What an account has done. Rows here add to, or replace by id, the rows the platform already has. */
export type Activity = {
  following: string[]
  joined: string[]
  /** Poll id to the option picked. */
  votes: Record<string, string>
  posts: Post[]
  inquiries: Inquiry[]
  staff: Staff[]
}
export const noActivity: Activity = { following: [], joined: [], votes: {}, posts: [], inquiries: [], staff: [] }

export const STAGES = ['Introduced', 'In committee', 'Passed one chamber', 'Passed both chambers', 'Signed into law']
export const STATUSES = ['New', 'In progress', 'Answered'] as const

const merged = <T extends { id: string }>(base: T[], mine: T[]) => [
  ...base.map((b) => mine.find((m) => m.id === b.id) ?? b),
  ...mine.filter((m) => !base.some((b) => b.id === m.id)),
]
/** Adds a row, or replaces the one with the same id. */
export const upsert = <T extends { id: string }>(rows: T[], row: T) => [...rows.filter((r) => r.id !== row.id), row]
export const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const newest = (a: { at: number }, b: { at: number }) => b.at - a.at

// Accounts

export const demoAccounts = () => seed.accounts
export const account = (id: string) => seed.accounts.find((a) => a.data.id === id.trim().toLowerCase())

// Geography and members

export const members = () => seed.members
export const member = (id: string) => seed.members.find((m) => m.id === id)
export const memberLabel = (m: Member) => `${m.name} (${m.seat})`
export const memberRole = (m: Member) => `${m.chamber} · ${m.seat}`
/** The member whose office a government account belongs to. */
export const officeOf = (d: Data) => seed.members.find((m) => memberLabel(m) === d.member)

/** Districts and representatives for the address on the account. Observers have none. */
export function jurisdiction(d: Data) {
  const abroad = d.lives === 'abroad'
  const state = STATES.find(([code]) => code === (abroad ? d.lastState : d.state))?.[1]
  const zip = (abroad ? d.lastZip : d.zip).slice(0, 5)
  const found = moduleOf(d).observer ? undefined : seed.jurisdictions.find((j) => j.zips.includes(zip))
  const rows: [string, string][] = found
    ? [
        ['Congressional district', found.district],
        ['State', state ?? ''],
        ['County', found.county],
        ['State senate / house', found.stateLeg],
      ]
    : state && !moduleOf(d).observer
      ? [['State', state]]
      : []
  return { district: found?.district ?? '', rows, reps: (found?.reps ?? []).flatMap((id) => member(id) ?? []) }
}

/** How other users see someone: first name, last initial and district ("Ivan R. · VA-11"). */
export const handle = (d: Data) => [person(d).display, jurisdiction(d).district].filter(Boolean).join(' · ')

/** What a new personal account follows from the start: its representatives and chosen issues. */
export const defaultFollowing = (d: Data) => [
  ...jurisdiction(d).reps.map((m) => `member:${m.id}`),
  ...d.issues.map((issue) => `issue:${issue}`),
]

// Legislation, posts, polls, communities

export const bills = () => seed.bills
export const bill = (id: string) => seed.bills.find((b) => b.id === id)

const allPosts = (a: Activity) => merged(seed.posts, a.posts)
/** Posts in one place, oldest first, the way a conversation reads. */
export const posts = (a: Activity, on: string) => allPosts(a).filter((p) => p.on === on).sort((x, y) => x.at - y.at)
export const newPost = (on: string, by: string, text: string, status?: Post['status']): Post => ({
  id: crypto.randomUUID(),
  on,
  by,
  text,
  at: Date.now(),
  status,
})

export const polls = (by: string) => seed.polls.filter((p) => p.by === by)
/** Seeded counts plus this account's own vote. */
export const tally = (p: Poll, a: Activity) =>
  p.options.map(([label, votes]) => [label, votes + (a.votes[p.id] === label ? 1 : 0)] as [string, number])

export const communities = () => seed.communities
export const community = (id: string) => seed.communities.find((c) => c.id === id)

export type FeedItem =
  | { kind: 'bill'; at: number; bill: Bill; text: string }
  | { kind: 'post'; at: number; post: Post; member: Member }
  | { kind: 'poll'; at: number; poll: Poll; member: Member }

/** Latest activity from what the account follows, newest first. */
export function feed(a: Activity): FeedItem[] {
  const follows = (id: string) => a.following.includes(id)
  const items: FeedItem[] = []
  for (const b of seed.bills)
    if (follows(`bill:${b.id}`) || follows(`issue:${b.issue}`))
      items.push({ kind: 'bill', bill: b, ...[...b.actions].sort(newest)[0] })
  for (const m of seed.members.filter((m) => follows(`member:${m.id}`))) {
    for (const post of posts(a, `member:${m.id}`))
      if (post.status === 'published') items.push({ kind: 'post', at: post.at, post, member: m })
    for (const poll of polls(m.id)) items.push({ kind: 'poll', at: poll.at, poll, member: m })
  }
  return items.sort(newest)
}

// Constituent inquiries and office work

const allInquiries = (a: Activity) => merged(seed.inquiries, a.inquiries).sort(newest)
export const inquiry = (a: Activity, id: string) => allInquiries(a).find((i) => i.id === id)
/** Inquiries this account sent. */
export const sent = (d: Data, a: Activity) => allInquiries(a).filter((i) => i.by === d.id)
/** Inquiries addressed to this account's office. */
export const inbox = (d: Data, a: Activity) => allInquiries(a).filter((i) => i.to === officeOf(d)?.id)

export const staff = (d: Data, a: Activity) => merged(seed.staff, a.staff).filter((s) => s.office === officeOf(d)?.id)
/** Who approves staff access for this office. */
export const admin = (d: Data) => seed.staff.find((s) => s.office === officeOf(d)?.id && s.level === 'Administrator')

/** "3 hours ago", "2 days ago". */
export function ago(at: number, now = Date.now()) {
  const minutes = Math.round((at - now) / 60_000)
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return fmt.format(minutes, 'minute')
  if (Math.abs(minutes) < 60 * 24) return fmt.format(Math.round(minutes / 60), 'hour')
  return fmt.format(Math.round(minutes / 60 / 24), 'day')
}

// Self-check, dev only: the seed is edited by hand for demos, so catch ids that point at nothing.
if (import.meta.env.DEV) {
  const known = (id: string) => seed.members.some((m) => m.id === id)
  console.assert(
    seed.bills.every((b) => known(b.sponsor) && Object.keys(b.votes).every(known)) &&
      seed.jurisdictions.every((j) => j.reps.every(known)) &&
      seed.polls.every((p) => known(p.by)) &&
      [...seed.inquiries.map((i) => i.to), ...seed.staff.map((s) => s.office)].every(known),
    'seed.ts: a bill, district, poll, inquiry or staff row names a member that does not exist',
  )
  console.assert(
    seed.accounts.every((a) => !a.data.member || seed.members.some((m) => memberLabel(m) === a.data.member)),
    'seed.ts: a demo account belongs to an office that is not in members',
  )
}
