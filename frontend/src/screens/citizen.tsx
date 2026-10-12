import { useState, type ReactNode } from 'react'
import * as api from '../api.ts'
import { age, eighteenth, ISSUES, moduleOf, useFlow, type Data } from '../flow.ts'
import { Avatar, Banner, Bars, Composer, Follow, Icon, KV, Posts, Shell, Tag } from '../ui.tsx'

const NAV = [
  ['Home', 'home', '#home'],
  ['Government', 'gov', '#government'],
  ['Legislation', 'doc', '#legislation'],
  ['Community', 'people', '#community'],
  ['Messages', 'chat', '#messages'],
] as const

/** Under-18s can read everything but cannot post or comment until their 18th birthday (GC 101). */
const minorNote = (d: Data) =>
  d.dob && age(d.dob) < 18 ? `Posting and commenting unlock on your 18th birthday (${eighteenth(d.dob)}).` : undefined

const When = ({ at }: { at: number }) => <time dateTime={new Date(at).toISOString()}>{api.ago(at)}</time>

function Missing({ what, back }: { what: string; back: readonly [string, string] }) {
  return (
    <Shell nav={NAV} title="Not found" back={back}>
      <p className="hint">That {what} does not exist.</p>
    </Shell>
  )
}

function BillCard({ bill, note }: { bill: api.Bill; note?: ReactNode }) {
  const { data } = useFlow()
  return (
    <>
      <p className="meta">
        <Tag>{bill.issue}</Tag>
        <span>{data.issues.includes(bill.issue) ? 'One of your issues · ' : ''}{api.STAGES[bill.stage]}</span>
      </p>
      <a className="title" href={`#legislation/${bill.id}`}>
        {bill.number} · {bill.title}
      </a>
      <p>{note ?? bill.summary}</p>
    </>
  )
}

function PollCard({ poll }: { poll: api.Poll }) {
  const { me, act } = useFlow()
  const mine = me.votes[poll.id]
  return (
    <fieldset className="poll">
      <legend>{poll.question}</legend>
      {mine ? (
        <>
          <Bars rows={api.tally(poll, me)} />
          <p className="hint">You voted {mine}.</p>
        </>
      ) : (
        <div className="opts chips">
          {poll.options.map(([label]) => (
            <button
              type="button"
              className="btn small secondary"
              key={label}
              onClick={() => act({ votes: { ...me.votes, [poll.id]: label } })}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  )
}

export function Home() {
  const { data, me } = useFlow()
  const items = api.feed(me)
  return (
    <Shell nav={NAV} title="Home">
      <Banner icon="people" tone="tint">
        {moduleOf(data).name} · {api.handle(data)}
      </Banner>
      {items.length === 0 && (
        <p className="hint">
          Nothing here yet. Follow <a href="#legislation">legislation</a> or <a href="#government">officials</a> to
          fill your feed.
        </p>
      )}
      <ul className="feed">
        {items.map((item) =>
          item.kind === 'bill' ? (
            <li className="card" key={item.bill.id}>
              <BillCard bill={item.bill} note={<>{item.text} · <When at={item.at} /></>} />
            </li>
          ) : (
            <li className="card" key={item.kind === 'post' ? item.post.id : item.poll.id}>
              <p className="meta">
                <a href={`#government/${item.member.id}`}>{item.member.name}</a>
                <When at={item.at} />
              </p>
              {item.kind === 'post' ? <p>{item.post.text}</p> : <PollCard poll={item.poll} />}
            </li>
          ),
        )}
      </ul>
    </Shell>
  )
}

function MemberList({ members }: { members: api.Member[] }) {
  return (
    <ul className="people">
      {members.map((m) => (
        <li className="person" key={m.id}>
          <Avatar verified />
          <a href={`#government/${m.id}`}>
            <b>{m.name}</b>
            <small>{api.memberRole(m)}</small>
          </a>
          <Follow id={`member:${m.id}`} name={m.name} />
        </li>
      ))}
    </ul>
  )
}

export function Government() {
  const { data, path } = useFlow()
  if (path[0]) return <MemberPage id={path[0]} />
  const { reps } = api.jurisdiction(data)
  return (
    <Shell nav={NAV} title="Government">
      <section className="section">
        <h2 className="label">Your representatives</h2>
        {reps.length ? (
          <MemberList members={reps} />
        ) : (
          <p className="hint">
            {moduleOf(data).observer
              ? 'Observers have no assigned representatives.'
              : 'No representatives are assigned to your address yet.'}
          </p>
        )}
      </section>
      <section className="section">
        <h2 className="label">{reps.length ? 'Other officials' : 'Officials'}</h2>
        <MemberList members={api.members().filter((m) => !reps.includes(m))} />
      </section>
    </Shell>
  )
}

function MemberPage({ id }: { id: string }) {
  const { data, me } = useFlow()
  const m = api.member(id)
  if (!m) return <Missing what="official" back={['Government', '#government']} />
  const mine = api.jurisdiction(data).reps.includes(m)
  const voted = api.bills().filter((b) => b.votes[m.id])
  return (
    <Shell nav={NAV} title={m.name} back={['Government', '#government']}>
      <div className="card person">
        <Avatar verified lg />
        <span>
          <b>{api.memberRole(m)}</b>
          <small>{mine ? `${m.office} · Your representative` : m.office}</small>
        </span>
        <Follow id={`member:${m.id}`} name={m.name} />
      </div>
      <section className="section">
        <h2 className="label">Voting record</h2>
        {voted.length === 0 && <p className="hint">No recorded votes yet.</p>}
        <ul className="rows">
          {voted.map((b) => (
            <li key={b.id}>
              <a href={`#legislation/${b.id}`}>
                {b.number} · {b.title}
              </a>
              <Tag>{b.votes[m.id]}</Tag>
            </li>
          ))}
        </ul>
      </section>
      <section className="section">
        <h2 className="label">From this office</h2>
        {api.polls(m.id).map((poll) => (
          <div className="card" key={poll.id}>
            <PollCard poll={poll} />
          </div>
        ))}
        <Posts
          posts={api.posts(me, `member:${m.id}`).filter((p) => p.status === 'published')}
          empty="No posts yet."
        />
      </section>
      <section className="section">
        <h2 className="label">Contact this office</h2>
        {/* Access Matrix section I: constituent inquiry is a "Yes" with a U.S. address and conditional abroad. */}
        {!mine ? (
          <Banner icon="info">Constituent inquiries go to your own representatives.</Banner>
        ) : data.lives === 'abroad' ? (
          <Banner icon="info">Constituent inquiry is conditional for your module — offices decide.</Banner>
        ) : (
          <InquiryForm to={m} />
        )}
      </section>
    </Shell>
  )
}

function InquiryForm({ to }: { to: api.Member }) {
  const { data, me, act } = useFlow()
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const [subject, issue, text] = ['subject', 'issue', 'text'].map((k) => String(f.get(k)).trim())
        if (!subject || !text) return
        const id = crypto.randomUUID()
        const from = api.handle(data)
        act({ inquiries: [...me.inquiries, { id, to: to.id, by: data.id, from, subject, issue, text, at: Date.now(), status: 'New' }] })
        location.assign(`#messages/${id}`)
      }}
    >
      <label className="field">
        <span className="label">Subject</span>
        <span className="control">
          <input name="subject" maxLength={120} required />
        </span>
      </label>
      <label className="field">
        <span className="label">Issue</span>
        <span className="control">
          <select name="issue" defaultValue="" required>
            <option value="">Select…</option>
            {[...ISSUES, 'Other'].map((issue) => (
              <option key={issue}>{issue}</option>
            ))}
          </select>
        </span>
      </label>
      <label className="field">
        <span className="label">Message</span>
        <textarea name="text" rows={5} maxLength={2000} required />
      </label>
      <button className="btn primary">Send inquiry</button>
    </form>
  )
}

export function Legislation() {
  const { path } = useFlow()
  const [q, setQ] = useState('')
  if (path[0]) return <BillPage id={path[0]} />
  const shown = api.bills().filter((b) => `${b.number} ${b.title} ${b.issue}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Shell nav={NAV} title="Legislation">
      <label className="control search">
        <Icon name="search" />
        <input
          type="search"
          placeholder="Search bills and issues"
          aria-label="Search bills and issues"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <p className="sr-only" role="status">
        {shown.length} {shown.length === 1 ? 'bill' : 'bills'}
      </p>
      {shown.length === 0 && <p className="hint">No bills match “{q.trim()}”.</p>}
      <ul className="feed">
        {shown.map((b) => (
          <li className="card" key={b.id}>
            <BillCard bill={b} />
          </li>
        ))}
      </ul>
    </Shell>
  )
}

function BillPage({ id }: { id: string }) {
  const { data, me, act } = useFlow()
  const b = api.bill(id)
  if (!b) return <Missing what="bill" back={['Legislation', '#legislation']} />
  const sponsor = api.member(b.sponsor)
  const { reps } = api.jurisdiction(data)
  const on = `bill:${b.id}`
  return (
    <Shell nav={NAV} title={`${b.number} · ${b.title}`} back={['Legislation', '#legislation']}>
      <div className="progress">
        <div aria-hidden="true">
          {api.STAGES.map((stage, i) => (
            <i key={stage} className={i <= b.stage ? 'on' : undefined} />
          ))}
        </div>
        <p>
          <span>{api.STAGES[b.stage]}</span>
          <span>
            Step {b.stage + 1} of {api.STAGES.length}
          </span>
        </p>
      </div>
      <p>{b.summary}</p>
      <div className="row">
        <Tag>{b.issue}</Tag>
        <Follow id={on} name={b.number} />
      </div>
      {sponsor && <KV rows={[['Sponsor', <a key={sponsor.id} href={`#government/${sponsor.id}`}>{sponsor.name}</a>]]} />}
      {reps.length > 0 && (
        <section className="section">
          <h2 className="label">How your representatives voted</h2>
          <KV rows={reps.map((m) => [m.name, b.votes[m.id] ?? 'No vote yet'])} />
        </section>
      )}
      <section className="section">
        <h2 className="label">Actions</h2>
        <ol className="rows">
          {[...b.actions].reverse().map((a) => (
            <li key={a.at}>
              <span>{a.text}</span>
              <When at={a.at} />
            </li>
          ))}
        </ol>
      </section>
      <section className="section">
        <h2 className="label">Discussion</h2>
        <Posts posts={api.posts(me, on)} empty="No comments yet." />
        <Composer
          label="Add a comment"
          button="Comment"
          blocked={minorNote(data)}
          onSend={(text) => act({ posts: [...me.posts, api.newPost(on, api.handle(data), text)] })}
        />
      </section>
    </Shell>
  )
}

export function Community() {
  const { data, me, act, path } = useFlow()
  const join = (c: api.Community) => {
    const joined = me.joined.includes(c.id)
    return (
      <button
        type="button"
        className={joined ? 'btn small secondary' : 'btn small primary'}
        onClick={() => act({ joined: api.toggle(me.joined, c.id) })}
      >
        {joined ? 'Leave' : 'Join'}
        <span className="sr-only"> {c.name}</span>
      </button>
    )
  }
  const size = (c: api.Community) => `${(c.members + (me.joined.includes(c.id) ? 1 : 0)).toLocaleString('en-US')} members`

  if (path[0]) {
    const c = api.community(path[0])
    if (!c) return <Missing what="community" back={['Community', '#community']} />
    const on = `community:${c.id}`
    return (
      <Shell nav={NAV} title={c.name} back={['Community', '#community']}>
        <p>{c.about}</p>
        <div className="row">
          <span className="hint">{size(c)}</span>
          {join(c)}
        </div>
        <Posts posts={api.posts(me, on)} empty="No posts yet." />
        <Composer
          label="Write a post"
          blocked={minorNote(data) ?? (me.joined.includes(c.id) ? undefined : 'Join this community to post.')}
          onSend={(text) => act({ posts: [...me.posts, api.newPost(on, api.handle(data), text)] })}
        />
      </Shell>
    )
  }

  return (
    <Shell nav={NAV} title="Community">
      <ul className="feed">
        {api.communities().map((c) => (
          <li className="card" key={c.id}>
            <a className="title" href={`#community/${c.id}`}>
              {c.name}
            </a>
            <p>{c.about}</p>
            <div className="row">
              <span className="hint">{size(c)}</span>
              {join(c)}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

export function Messages() {
  const { data, me, act, path } = useFlow()
  const mine = api.sent(data, me)

  if (path[0]) {
    const i = mine.find((x) => x.id === path[0])
    if (!i) return <Missing what="message" back={['Messages', '#messages']} />
    const on = `inquiry:${i.id}`
    return (
      <Shell nav={NAV} title={i.subject} back={['Messages', '#messages']}>
        <p className="meta">
          <span>To {api.member(i.to)?.office}</span>
          <Tag>{i.status}</Tag>
        </p>
        <Posts posts={[{ id: i.id, on, by: i.from, text: i.text, at: i.at }, ...api.posts(me, on)]} empty="" />
        <Composer
          label="Add to this inquiry"
          button="Send"
          onSend={(text) => act({ posts: [...me.posts, api.newPost(on, api.handle(data), text)] })}
        />
      </Shell>
    )
  }

  return (
    <Shell nav={NAV} title="Messages">
      {mine.length === 0 && (
        <p className="hint">
          No messages yet. You can write to <a href="#government">your representatives</a>.
        </p>
      )}
      <ul className="feed">
        {mine.map((i) => (
          <li className="card" key={i.id}>
            <p className="meta">
              <Tag>{i.status}</Tag>
              <When at={i.at} />
            </p>
            <a className="title" href={`#messages/${i.id}`}>
              {i.subject}
            </a>
            <p>To {api.member(i.to)?.office}</p>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
