import { useState } from 'react'
import * as api from '../api.ts'
import { delegated, roleLine, useFlow } from '../flow.ts'
import { Banner, Bars, Composer, Module, Posts, Shell, Tag } from '../ui.tsx'

const NAV = [
  ['Overview', 'home', '#office'],
  ['Inquiries', 'chat', '#office/inquiries'],
  ['Posts', 'doc', '#office/posts'],
  ['Legislation', 'gov', '#office/legislation'],
  ['Staff', 'people', '#office/staff'],
] as const

const When = ({ at }: { at: number }) => <time dateTime={new Date(at).toISOString()}>{api.ago(at)}</time>

/** The Legislative Office workspace (Access Matrix section I, government columns). */
export function Office() {
  const { path } = useFlow()
  switch (path[0]) {
    case 'inquiries':
      return <Inquiries />
    case 'posts':
      return <OfficePosts />
    case 'legislation':
      return <OfficeLegislation />
    case 'staff':
      return <Team />
    default:
      return <Overview />
  }
}

function InquiryList({ items, open }: { items: api.Inquiry[]; open?: string }) {
  return (
    <ul className="feed">
      {items.map((i) => (
        <li className="card" key={i.id}>
          <p className="meta">
            <Tag>{i.status}</Tag>
            <When at={i.at} />
          </p>
          <a className="title" href={`#office/inquiries/${i.id}`} aria-current={open === i.id ? 'true' : undefined}>
            {i.subject}
          </a>
          <p>
            {i.from} · {i.issue}
          </p>
        </li>
      ))}
    </ul>
  )
}

function Overview() {
  const { data, me } = useFlow()
  const id = api.officeOf(data)?.id ?? ''
  const inbox = api.inbox(data, me)
  const issues = [...new Set(inbox.map((i) => i.issue))].map(
    (issue) => [issue, inbox.filter((i) => i.issue === issue).length] as const,
  )
  const stats: [value: number, label: string, href?: string][] = [
    [inbox.filter((i) => i.status !== 'Answered').length, 'Open inquiries', '#office/inquiries'],
    [api.posts(me, `member:${id}`).filter((p) => p.status === 'pending').length, 'Posts awaiting approval', '#office/posts'],
    [api.bills().filter((b) => b.sponsor === id).length, 'Bills sponsored', '#office/legislation'],
    [api.polls(id).flatMap((p) => api.tally(p, me)).reduce((sum, [, votes]) => sum + votes, 0), 'Poll responses'],
  ]
  return (
    <Shell nav={NAV} title="Overview" wide>
      <Module
        eyebrow="GC LEGISLATIVE OFFICE"
        name={data.office}
        line={roleLine(data)}
        tagline="Represent → Communicate → Legislate → Oversight → Constituents"
      />
      <ul className="stats">
        {stats.map(([value, label, href]) => (
          <li className="card" key={label}>
            <b>{value.toLocaleString('en-US')}</b>
            {href ? <a href={href}>{label}</a> : label}
          </li>
        ))}
      </ul>
      <div className="cols2">
        <section className="section">
          <h2 className="label">Inquiries by issue</h2>
          {issues.length ? <Bars rows={issues} /> : <p className="hint">No inquiries yet.</p>}
        </section>
        <section className="section">
          <h2 className="label">Newest inquiries</h2>
          {inbox.length ? <InquiryList items={inbox.slice(0, 3)} /> : <p className="hint">No inquiries yet.</p>}
        </section>
      </div>
    </Shell>
  )
}

function Inquiries() {
  const { data, me, act, path } = useFlow()
  const [filter, setFilter] = useState('All')
  const inbox = api.inbox(data, me)
  const shown = inbox.filter((i) => filter === 'All' || i.status === filter)
  const open = inbox.find((i) => i.id === path[1])
  const on = `inquiry:${open?.id}`
  return (
    <Shell nav={NAV} title="Constituent inquiries" wide>
      {/* Side by side on desktop. On a phone the open inquiry replaces the list. */}
      <div className={open ? 'panes open' : 'panes'}>
        <section className="section" aria-label="Inbox">
          <div className="opts segmented" role="group" aria-label="Filter by status">
            {['All', ...api.STATUSES].map((s) => (
              <button type="button" className="choice" key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          {shown.length === 0 && <p className="hint">No inquiries here.</p>}
          <InquiryList items={shown} open={open?.id} />
        </section>
        <section className="section" aria-label="Inquiry">
          {open ? (
            <>
              <a className="link" href="#office/inquiries">
                ‹ All inquiries
              </a>
              <h2>{open.subject}</h2>
              <p className="meta">
                <span>
                  {open.from} · {open.issue}
                </span>
                <When at={open.at} />
              </p>
              <label className="field">
                <span className="label">Status</span>
                <span className="control">
                  <select
                    value={open.status}
                    onChange={(e) =>
                      act({ inquiries: api.upsert(me.inquiries, { ...open, status: e.target.value as api.Inquiry['status'] }) })
                    }
                  >
                    {api.STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </span>
              </label>
              <Posts posts={[{ id: open.id, on, by: open.from, text: open.text, at: open.at }, ...api.posts(me, on)]} empty="" />
              <Composer
                label="Reply to the constituent"
                button="Send reply"
                onSend={(text) =>
                  act({
                    posts: [...me.posts, api.newPost(on, data.office, text)],
                    inquiries: api.upsert(me.inquiries, { ...open, status: 'Answered' }),
                  })
                }
              />
            </>
          ) : (
            <p className="hint">Select an inquiry to read and answer it.</p>
          )}
        </section>
      </div>
    </Shell>
  )
}

function OfficePosts() {
  const { data, me, act } = useFlow()
  const id = api.officeOf(data)?.id ?? ''
  const on = `member:${id}`
  const staff = delegated(data)
  return (
    <Shell nav={NAV} title="Posts and polls" wide>
      <div className="cols2">
        <section className="section">
          <h2 className="label">Official posts</h2>
          <Composer
            label="New official post"
            button={staff ? 'Submit for approval' : 'Publish'}
            onSend={(text) => act({ posts: [...me.posts, api.newPost(on, data.office, text, staff ? 'pending' : 'published')] })}
          />
          {staff && <p className="hint">Staff drafts are published once an official approves them.</p>}
          <ul className="feed" aria-live="polite">
            {api
              .posts(me, on)
              .reverse()
              .map((p) => (
                <li className="card" key={p.id}>
                  <p className="meta">
                    <Tag>{p.status === 'pending' ? 'Awaiting approval' : 'Published'}</Tag>
                    <When at={p.at} />
                  </p>
                  <p>{p.text}</p>
                  {p.status === 'pending' && !staff && (
                    <button
                      type="button"
                      className="btn small primary"
                      onClick={() => act({ posts: api.upsert(me.posts, { ...p, status: 'published' }) })}
                    >
                      Approve and publish
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </section>
        <section className="section">
          <h2 className="label">Official polls</h2>
          {api.polls(id).length === 0 && <p className="hint">No polls yet.</p>}
          {api.polls(id).map((p) => (
            <div className="card" key={p.id}>
              <p>
                <b>{p.question}</b>
              </p>
              <Bars rows={api.tally(p, me)} />
            </div>
          ))}
        </section>
      </div>
    </Shell>
  )
}

function OfficeLegislation() {
  const { data } = useFlow()
  const id = api.officeOf(data)?.id ?? ''
  return (
    <Shell nav={NAV} title="Legislation" wide>
      <ul className="rows">
        {api.bills().map((b) => (
          <li key={b.id}>
            <span>
              <b>
                {b.number} · {b.title}
              </b>
              <small>
                {b.sponsor === id ? 'Sponsored by this office · ' : ''}
                {api.STAGES[b.stage]}
              </small>
            </span>
            <Tag>{b.votes[id] ?? 'No vote yet'}</Tag>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

function Team() {
  const { data, me, act } = useFlow()
  const staff = delegated(data)
  const decide = (s: api.Staff, status: api.Staff['status']) => act({ staff: api.upsert(me.staff, { ...s, status }) })
  const team = api.staff(data, me)
  return (
    <Shell nav={NAV} title="Staff" wide>
      {team.length === 0 && <p className="hint">No staff on file for this office yet.</p>}
      <ul className="rows" aria-live="polite">
        {team.map((s) => (
          <li key={s.id}>
            <span>
              <b>{s.name}</b>
              <small>
                {s.title} · {s.level}
              </small>
            </span>
            <Tag>{s.status}</Tag>
            {s.status === 'Pending' && !staff && (
              <>
                <button type="button" className="btn small primary" onClick={() => decide(s, 'Active')}>
                  Approve<span className="sr-only"> {s.name}</span>
                </button>
                <button type="button" className="btn small secondary" onClick={() => decide(s, 'Declined')}>
                  Decline<span className="sr-only"> {s.name}</span>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {staff && (
        <Banner icon="people">
          Staff permissions are delegated by an authorized office administrator and are revocable.
        </Banner>
      )}
    </Shell>
  )
}
