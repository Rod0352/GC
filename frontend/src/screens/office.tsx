import { useState } from 'react'
import { fixture, moduleOf, person, useFlow, type Data } from '../flow.ts'
import { Avatar, Banner, Caps, Choices, Dialog, Field, Icon, KV, Module, Placeholder, Screen, Select } from '../ui.tsx'
import type { IconName } from '../ui.tsx'

const ROLES = [
  { value: 'elected', label: 'Elected official (the member)' },
  { value: 'official', label: 'Government official' },
  { value: 'staff', label: 'Staff — I support this office' },
]

const roleLine = (d: Data) =>
  `${{ elected: 'Elected official', official: 'Government official' }[d.role] ?? 'Staff'} · ${d.title || 'Legislative Assistant'}`

export function GovAccount() {
  return (
    <Screen
      bar="Government / Office"
      progress={['Office', 1, 6]}
      heading="Set up a Government / Office account"
      sub="Use your official government email. Personal demographic and political questions are not part of this path."
      footer={<button className="btn primary">Continue</button>}
    >
      <Field
        label="Government email"
        name="govEmail"
        type="email"
        icon="mail"
        placeholder="jane.doe@mail.house.gov"
        autoComplete="email"
        required
        hint="Accepted domains: .gov, .mil, house.gov, senate.gov, state and local domains on file."
      />
      <Field label="Office / institution" name="office" icon="gov" placeholder={fixture.office} required />
      <Field
        label="Office phone (optional)"
        name="officePhone"
        type="tel"
        icon="phone"
        placeholder="+1 202 225 0000"
        autoComplete="tel"
      />
      <Banner icon="shield" tone="tint">
        Government accounts get stronger verification because they can represent an official office.
      </Banner>
    </Screen>
  )
}

export function GovOffice() {
  return (
    <Screen
      bar="Government level"
      progress={['Office', 2, 6]}
      heading="Identify your government level and office"
      footer={<button className="btn primary">Continue</button>}
    >
      {/* Phase 1 is federal only; state and local bodies are not designed yet. */}
      <Choices
        legend="Level"
        name="level"
        variant="segmented"
        options={[
          'Federal',
          { value: 'State', label: 'State', disabled: true },
          { value: 'Local', label: 'Local', disabled: true },
        ]}
      />
      <Choices
        legend="Branch / body"
        name="branch"
        required
        options={['U.S. House of Representatives', 'U.S. Senate', 'Committee or subcommittee', 'Federal agency']}
      />
      <Select label="Member / office" name="member" options={[fixture.member]} placeholder="Select…" required />
      <Select
        label="Workspace / department"
        name="workspace"
        options={[
          'Legislative Affairs',
          'Congressional Affairs',
          'Congressional Relations',
          'Government Affairs',
          'Public Policy',
          'Legal',
          'Communications',
        ]}
        placeholder="Select…"
        required
      />
    </Screen>
  )
}

export function GovRole() {
  const { data } = useFlow()
  return (
    <Screen
      bar="Your role"
      progress={['Role', 3, 6]}
      heading="What is your role in this office?"
      footer={<button className="btn primary">Continue</button>}
    >
      <Choices legend="Role" hideLegend name="role" required options={ROLES} />
      <Field label="Official title" name="title" icon="briefcase" placeholder="Legislative Assistant" required />
      <Select
        label="Role level (requested)"
        name="roleLevel"
        options={['Owner', 'Administrator', 'Director', 'Manager', 'Counsel', 'Analyst', 'Staff', 'Communications']}
        placeholder="Select…"
        required
      />
      {data.role === 'staff' && (
        <Banner icon="people">
          Staff permissions are delegated by an authorized office administrator and are revocable.
        </Banner>
      )}
    </Screen>
  )
}

export function GovVerify() {
  const { data, set } = useFlow()
  const checked = data.identity === 'done'
  const checks: [title: string, desc: string, done: boolean][] = [
    ['Government email', `Code sent to ${data.govEmail || 'your government email'}`, true],
    ['Office confirmation', 'We match your office against the official directory.', true],
    ['Identity check', 'Government-issued ID via secure provider', checked],
    ['Administrator approval', 'Only for staff accounts', false],
  ]
  return (
    <Screen
      bar="Verification"
      progress={['Verify', 4, 6]}
      heading="Verify your office and identity"
      sub="Required for every government account."
      footer={
        <>
          <p className="note">You can leave and come back; progress is saved.</p>
          <button className="btn primary" disabled={!checked}>
            Continue
          </button>
        </>
      }
    >
      <ol className="checks">
        {checks.map(([title, desc, done], i) => (
          <li key={title}>
            <span className={done ? 'dot done' : 'dot'} aria-hidden="true">
              {done ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span>
              <b>{title}</b>
              <small>{desc}</small>
              <span className="sr-only">{done ? 'Done' : 'Not done yet'}</span>
            </span>
          </li>
        ))}
      </ol>
      {/* ponytail: marks the check done locally. Wire to the ID provider once one is chosen. */}
      {!checked && (
        <button type="button" className="btn primary" onClick={() => set({ identity: 'done' })}>
          <Icon name="id" />
          Start identity check
        </button>
      )}
    </Screen>
  )
}

export function GovApproval() {
  const { data, set } = useFlow()
  const [resent, setResent] = useState(false)
  const [sent] = useState(() => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
  return (
    <Screen
      bar="Approval"
      progress={['Approval', 5, 6]}
      top={<Placeholder label="waiting illustration" />}
      heading="Waiting for your office administrator"
      sub={`${fixture.admin} has been asked to approve your access to ${data.office || fixture.office}. GC assigns your permission level when they do.`}
      footer={
        <>
          <a className="btn secondary" href="#home" onClick={() => set({ context: 'personal' })}>
            Use my personal account meanwhile
          </a>
          <button type="button" className="btn ghost" disabled={resent} onClick={() => setResent(true)}>
            {resent ? 'Request resent' : 'Resend request'}
          </button>
        </>
      }
    >
      <KV
        rows={[
          ['Office', data.member || fixture.member],
          ['Requested role', roleLine(data)],
          ['Status', 'Pending'],
          ['Sent', `Today, ${sent}`],
        ]}
      />
    </Screen>
  )
}

export function GovReview() {
  const { data } = useFlow()
  const staff = data.role === 'staff' || !data.role
  // Staff get what the office administrator delegates; officials hold these outright (Access Matrix section I).
  const permissions: [string, boolean][] = [
    ['Constituent inquiries', true],
    ['Draft official posts (needs approval)', true],
    ['Publish official posts', !staff],
    ['Upload official legislation', !staff],
    ['Official polls / surveys', true],
    ['Office analytics', true],
    ['Manage staff', !staff],
  ]
  return (
    <Screen
      bar="Review"
      progress={['Review', 6, 6]}
      heading="Your office context"
      sub="This is separate from any personal GC account you hold."
      footer={<button className="btn primary">Enter office workspace</button>}
    >
      <Module
        eyebrow="GC LEGISLATIVE OFFICE"
        name={data.office || fixture.office}
        line={`${fixture.district} · ${data.branch || 'U.S. House'} · ${data.workspace || 'Legislative Affairs'}`}
        tagline="Represent → Communicate → Legislate → Oversight → Constituents"
      />
      <KV
        rows={[
          ['Role', roleLine(data)],
          ['Permission level', staff ? `Delegated (by ${fixture.adminShort})` : data.roleLevel],
          ['Verified', 'Email · Office · Identity'],
        ]}
      />
      <section className="section">
        <h2 className="label">{staff ? 'Delegated permissions' : 'Permissions'}</h2>
        <Caps items={permissions} />
      </section>
    </Screen>
  )
}

export function EnterWorkspace() {
  const { data, set } = useFlow()
  return (
    <Screen
      className="entering"
      top={
        <div className="switch" aria-hidden="true">
          <Avatar initials={person(data).initials} lg />
          <Icon name="arrow-r" />
          <span className="tile navy">
            <Icon name="gov" size={28} />
          </span>
        </div>
      }
      heading={`Entering ${data.office || fixture.office}`}
      sub={`Acting as: ${roleLine(data)}`}
      footer={
        <>
          <a className="btn primary" href="#home" onClick={() => set({ context: 'office' })}>
            Continue
          </a>
          <a className="btn ghost" href="#home" onClick={() => set({ context: 'personal' })}>
            Switch to personal instead
          </a>
        </>
      }
    >
      <Banner icon="alert" tone="warn">
        Anything you post here is official office activity and is logged for accountability. Your personal profile
        stays separate.
      </Banner>
    </Screen>
  )
}

const TABS: [string, IconName][] = [
  ['Home', 'home'],
  ['Government', 'gov'],
  ['Legislation', 'doc'],
  ['Community', 'people'],
  ['Messages', 'chat'],
]

/** App shell behind the context switcher. The feed itself is not designed yet. */
export function Home() {
  const { data, set } = useFlow()
  const [open, setOpen] = useState(!data.context)

  const contexts: [id: string, icon: IconName, title: string, sub: string][] = [
    ['personal', 'people', `Personal — ${person(data).display} · ${fixture.district}`, moduleOf(data).name],
    ['office', 'gov', data.office || fixture.office, `${roleLine(data)} · verified`],
  ]

  function pick(id: string) {
    set({ context: id })
    setOpen(false)
    // Every switch into an office context repeats the "Entering…" notice.
    if (id === 'office') location.assign('#enter-workspace')
  }

  return (
    <main className="screen">
      <header className="appbar">
        <span className="logo" aria-hidden="true">
          GC
        </span>
        <h1>Government &amp; Citizens</h1>
        <button type="button" className="icon-btn" aria-label="Search">
          <Icon name="search" size={22} />
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <Icon name="bell" size={22} />
        </button>
      </header>
      <div className="body">
        <label className="control search">
          <Icon name="search" />
          <input type="search" placeholder="Search bills, members, issues" aria-label="Search bills, members, issues" />
        </label>
        <Placeholder label="feed" />
        <Placeholder label="feed" />
      </div>
      <nav className="tabbar" aria-label="Primary">
        {TABS.map(([label, icon], i) => (
          <button type="button" key={label} aria-current={i === 0 ? 'page' : undefined}>
            <Icon name={icon} size={22} />
            {label}
          </button>
        ))}
      </nav>
      <Dialog open={open} title="Switch context" sheet onClose={() => setOpen(false)}>
        {contexts.map(([id, icon, title, sub]) => (
          <button
            type="button"
            className="choice"
            key={id}
            aria-pressed={data.context === id}
            onClick={() => pick(id)}
          >
            <span className={data.context === id ? 'tile on' : 'tile'}>
              <Icon name={icon} />
            </span>
            <span>
              <b>{title}</b>
              <small>{sub}</small>
            </span>
            {data.context === id && <Icon name="check" />}
          </button>
        ))}
        <a className="btn dashed" href="#account-type">
          Add another context
        </a>
        <p className="hint">Contexts are permission-separated. Switching is logged.</p>
      </Dialog>
    </main>
  )
}
