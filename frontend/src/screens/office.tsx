import { useState } from 'react'
import { admin, memberLabel, members, officeOf } from '../api.ts'
import { delegated, person, roleLine, useFlow } from '../flow.ts'
import { Avatar, Banner, Caps, Choices, Field, Icon, KV, Module, Placeholder, Screen, Select } from '../ui.tsx'

const ROLES = [
  { value: 'elected', label: 'Elected official (the member)' },
  { value: 'official', label: 'Government official' },
  { value: 'staff', label: 'Staff — I support this office' },
]

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
      <Field label="Office / institution" name="office" icon="gov" placeholder="Office of Rep. Jane Doe" required />
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
      <Select label="Member / office" name="member" options={members().map(memberLabel)} placeholder="Select…" required />
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
  const approver = admin(data)
  return (
    <Screen
      bar="Approval"
      progress={['Approval', 5, 6]}
      top={<Placeholder label="waiting illustration" />}
      heading="Waiting for your office administrator"
      sub={`${approver ? `${approver.name} (${approver.title})` : 'Your office administrator'} has been asked to approve your access to ${data.office}. GC assigns your permission level when they do.`}
      footer={
        <>
          {/* Without a personal account yet, this starts one. */}
          <a
            className="btn secondary"
            href={data.contexts.includes('personal') ? '#home' : '#account-type'}
            onClick={() => set({ context: 'personal' })}
          >
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
          ['Office', data.member],
          ['Requested role', roleLine(data)],
          ['Status', 'Pending'],
          ['Sent', `Today, ${sent}`],
        ]}
      />
    </Screen>
  )
}

export function GovReview() {
  const { data, submit } = useFlow()
  const staff = delegated(data)
  const approver = admin(data)
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
      onSubmit={() => submit({ contexts: [...new Set([...data.contexts, 'office'])] })}
      footer={<button className="btn primary">Enter office workspace</button>}
    >
      <Module
        eyebrow="GC LEGISLATIVE OFFICE"
        name={data.office}
        line={[officeOf(data)?.seat, data.branch, data.workspace].filter(Boolean).join(' · ')}
        tagline="Represent → Communicate → Legislate → Oversight → Constituents"
      />
      <KV
        rows={[
          ['Role', roleLine(data)],
          ['Permission level', staff ? `Delegated${approver ? ` (by ${approver.name})` : ''}` : data.roleLevel],
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
      heading={`Entering ${data.office}`}
      sub={`Acting as: ${roleLine(data)}`}
      footer={
        <>
          <a className="btn primary" href="#office" onClick={() => set({ context: 'office' })}>
            Continue
          </a>
          {data.contexts.includes('personal') && (
            <a className="btn ghost" href="#home" onClick={() => set({ context: 'personal' })}>
              Switch to personal instead
            </a>
          )}
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

