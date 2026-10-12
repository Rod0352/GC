import { useState, type MouseEvent } from 'react'
import { defaultFollowing, handle, jurisdiction, memberRole } from '../api.ts'
import { age, ageBand, collect, eighteenth, ISSUES, moduleOf, person, PNTS, useFlow, type Data } from '../flow.ts'
import { COUNTRIES, STATES } from '../places.ts'
import { Avatar, Banner, Caps, Choices, Dialog, Field, Icon, KV, Module, Placeholder, Screen, Select } from '../ui.tsx'

const CITIZENSHIP = [
  { value: 'citizen', label: 'U.S. citizen' },
  { value: 'permanent-resident', label: 'U.S. permanent resident' },
  { value: 'other-resident', label: 'Other U.S. resident' },
  { value: 'non-citizen', label: 'Not a U.S. citizen' },
]

const skipRow = (onSkip: (e: MouseEvent<HTMLButtonElement>) => void) => (
  <>
    <button type="button" className="btn secondary" onClick={onSkip}>
      Skip for now
    </button>
    <button className="btn primary">Continue</button>
  </>
)

export function Classification() {
  const { submit } = useFlow()
  return (
    <Screen
      bar="About you"
      progress={['Classification', 3, 9]}
      heading="Which describes you?"
      sub="Used only to set up the right GC module. Not shown publicly. No documents required."
      // Pre-answers the civic-connection question on the outside-U.S. screen where it follows.
      onSubmit={(p) =>
        submit({
          ...p,
          connection: p.citizenship === 'citizen' ? 'citizen' : p.citizenship === 'non-citizen' ? 'observer' : '',
        })
      }
      footer={<button className="btn primary">Continue</button>}
    >
      <Choices legend="Citizenship" name="citizenship" required options={CITIZENSHIP} />
      <Choices
        legend="Where do you live?"
        name="lives"
        variant="cols"
        required
        options={[
          { value: 'us', label: 'In the U.S.' },
          { value: 'abroad', label: 'Outside the U.S.' },
        ]}
      />
      <Banner icon="info">
        Citizenship, address, political identity and voting eligibility are kept as separate attributes.
      </Banner>
    </Screen>
  )
}

export function Address() {
  return (
    <Screen
      bar="Your address"
      progress={['Address', 4, 9]}
      heading="Where do you live?"
      sub="We use your address to find your representatives and districts. It is never public."
      footer={<button className="btn primary">Find my representatives</button>}
    >
      <Field
        label="Street address"
        name="street"
        icon="pin"
        placeholder="123 Main St"
        autoComplete="address-line1"
        required
      />
      <Field label="Apt / unit (optional)" name="unit" placeholder="Apt 4B" autoComplete="address-line2" />
      <div className="split">
        <Field label="City" name="city" placeholder="Fairfax" autoComplete="address-level2" required />
        <Select
          label="State"
          name="state"
          options={STATES.map(([code]) => code)}
          placeholder="Select…"
          autoComplete="address-level1"
          required
        />
      </div>
      <Field
        className="short"
        label="ZIP"
        name="zip"
        placeholder="22030"
        autoComplete="postal-code"
        inputMode="numeric"
        pattern="\d{5}(-\d{4})?"
        title="5-digit ZIP code"
        required
      />
      <Banner icon="info">
        Derived automatically: ZIP, county, congressional district, state legislative districts.
      </Banner>
    </Screen>
  )
}

export function Abroad() {
  const { data, submit } = useFlow()
  return (
    <Screen
      bar="Outside the U.S."
      progress={['Jurisdiction', 4, 9]}
      heading="You're outside the United States"
      sub="Tell us only what's needed to determine your U.S. jurisdiction."
      footer={
        <>
          <button className="btn primary">Continue</button>
          <button type="button" className="btn ghost" onClick={() => submit({ connection: 'observer' })}>
            Skip — I'm just observing
          </button>
        </>
      }
    >
      <Select
        label="Country of residence"
        name="country"
        options={COUNTRIES}
        placeholder="Select…"
        autoComplete="country-name"
        required
      />
      <Choices
        legend="U.S. civic connection"
        name="connection"
        required
        options={[
          { value: 'citizen', label: 'U.S. citizen living abroad' },
          { value: 'observer', label: 'Not a U.S. citizen — observer only' },
        ]}
      />
      {data.connection === 'citizen' && (
        <>
          <Select label="Last U.S. state of residence" name="lastState" options={STATES} placeholder="Select…" />
          <Field
            label="Last U.S. ZIP (optional)"
            name="lastZip"
            placeholder="22030"
            inputMode="numeric"
            pattern="\d{5}"
            title="5-digit ZIP code"
            hint="Used to assign your federal and state representatives, like a UOCAVA voter."
          />
        </>
      )}
    </Screen>
  )
}

export function Jurisdiction() {
  const { data } = useFlow()
  const { rows, reps } = jurisdiction(data)
  return (
    <Screen
      bar="Your districts"
      progress={['Address', 4, 9]}
      heading={reps.length ? 'We found your representatives' : 'We found your state'}
      sub="Confirm this looks right."
      footer={
        <>
          <button className="btn primary">Looks right</button>
          <button type="button" className="btn ghost" onClick={() => history.back()}>
            Not right? Edit address
          </button>
        </>
      }
    >
      <Placeholder label="district map" />
      <KV rows={rows} />
      {reps.length ? (
        <section className="section">
          <h2 className="label">Your representatives</h2>
          <ul className="people">
            {reps.map((m) => (
              <li className="person" key={m.id}>
                <Avatar verified />
                <span>
                  <b>{m.name}</b>
                  <small>{memberRole(m)}</small>
                </span>
                <Icon name="chev-r" />
              </li>
            ))}
          </ul>
          <p className="hint">State and local representatives arrive in Phase 3–4.</p>
        </section>
      ) : (
        <Banner icon="info">
          District lookup is not connected yet, so ZIP {data.zip} resolves to your state only. Your representatives
          are assigned once it is.
        </Banner>
      )}
    </Screen>
  )
}

// The spec leaves four lists open ("standardized industry categories", "income ranges", …). These use
// NAICS sectors, Census-style income brackets and marital status, and major religious traditions.
const INDUSTRIES = [
  'Agriculture, forestry & fishing',
  'Mining, oil & gas',
  'Utilities',
  'Construction',
  'Manufacturing',
  'Wholesale trade',
  'Retail trade',
  'Transportation & warehousing',
  'Information & media',
  'Finance & insurance',
  'Real estate',
  'Professional, scientific & technical services',
  'Management of companies',
  'Administrative & support services',
  'Education',
  'Health care & social assistance',
  'Arts, entertainment & recreation',
  'Accommodation & food services',
  'Public administration',
  'Other',
]
const INCOMES = [
  'Under $25,000',
  '$25,000–$49,999',
  '$50,000–$74,999',
  '$75,000–$99,999',
  '$100,000–$149,999',
  '$150,000–$199,999',
  '$200,000 or more',
]
const HOUSEHOLDS = ['Single', 'Married', 'Living with a partner', 'Separated', 'Divorced', 'Widowed']
const RELIGIONS = [
  'Protestant',
  'Catholic',
  'Orthodox Christian',
  'Latter-day Saint',
  'Other Christian',
  'Jewish',
  'Muslim',
  'Hindu',
  'Buddhist',
  'Sikh',
  'Other religion',
  'No religion',
]

const DEMOGRAPHICS: [label: string, name: keyof Data, options: string[]][] = [
  [
    'Education level',
    'education',
    ['Less than high school', 'High school/GED', 'Some college', 'Associate', "Bachelor's", "Master's", 'Professional', 'Doctorate'],
  ],
  [
    'Employment status',
    'employment',
    ['Full-time', 'Part-time', 'Self-employed', 'Student', 'Retired', 'Unemployed', 'Caregiver', 'Other'],
  ],
  ['Occupation / industry', 'industry', INDUSTRIES],
  ['Household income (range)', 'income', INCOMES],
  ['Housing status', 'housing', ['Own', 'Rent', 'Live with family', 'Student housing', 'Other']],
  ['Relationship / household', 'household', HOUSEHOLDS],
  ['Children', 'children', ['No children', 'Children under 18', 'Adult children', 'Both']],
  [
    'Military affiliation',
    'military',
    ['Active duty', 'Reserve', 'National Guard', 'Veteran', 'Military household', 'None'],
  ],
  ['Religion', 'religion', RELIGIONS],
]

const NO_DEMOGRAPHICS = {
  gender: PNTS,
  race: [],
  ...Object.fromEntries(DEMOGRAPHICS.map(([, name]) => [name, ''])),
} as Partial<Data>

export function Demographics() {
  const { data, set, submit } = useFlow()
  const [minor, setMinor] = useState(false)
  const [today] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD, local time

  // Under-18s may browse but not post, so they get told before moving on.
  function finish(p: Partial<Data>) {
    if (age(p.dob!) >= 18) return submit(p)
    set(p)
    setMinor(true)
  }

  return (
    <Screen
      bar="Demographics"
      progress={['Demographics', 5, 9]}
      heading="Optional: about you"
      sub="Every question offers 'Prefer not to say'. Skip the whole section if you like. Private by default."
      onSubmit={finish}
      row
      footer={skipRow((e) => {
        const form = e.currentTarget.form!
        if (form.reportValidity()) finish({ ...NO_DEMOGRAPHICS, dob: collect(form, data).dob })
      })}
    >
      <Field
        label="Date of birth *"
        name="dob"
        type="date"
        max={today}
        autoComplete="bday"
        required
        hint="Required for age-related rules. Exact date is private; GC derives age bands."
      />
      <Select label="Gender" name="gender" options={['Woman', 'Man', 'Non-binary', 'Another identity', PNTS]} />
      <Choices
        legend="Race / ethnicity (select all that apply)"
        name="race"
        multi
        variant="chips"
        options={[
          'Asian',
          'Black',
          'Hispanic / Latino',
          'Native American',
          'Pacific Islander',
          'White',
          'Other',
          PNTS,
        ]}
      />
      {DEMOGRAPHICS.map(([label, name, options]) => (
        <Select key={name} label={label} name={name} options={[...options, PNTS]} placeholder="Select…" />
      ))}
      <Dialog open={minor} title="Welcome, and one rule" onClose={() => setMinor(false)}>
        <p>You can browse everything on GC — legislation, votes, your representatives, and discussions.</p>
        <Banner icon="lock" tone="tint">
          Posting and commenting unlock on your 18th birthday ({data.dob && eighteenth(data.dob)}).
        </Banner>
        <button type="button" className="btn primary" onClick={() => submit()}>
          Got it
        </button>
      </Dialog>
    </Screen>
  )
}

export function Political() {
  const { submit } = useFlow()
  return (
    <Screen
      bar="Political identity"
      progress={['Political', 6, 9]}
      heading="Optional: political identity"
      sub="Voluntary, self-declared, private by default. Separate from citizenship, residency, voting eligibility and permissions."
      row
      footer={skipRow(() => submit({ party: '', strength: '', ideology: '' }))}
    >
      <Choices
        legend="Party identification"
        name="party"
        variant="chips"
        options={['Democrat', 'Republican', 'Independent', 'Libertarian', 'Green', 'Other', 'No affiliation', PNTS]}
      />
      <Choices
        legend="Party strength / lean"
        name="strength"
        variant="cols"
        options={['Very strong', 'Somewhat strong', 'Lean toward', 'Not very strong', PNTS]}
      />
      <Choices
        legend="Political ideology"
        name="ideology"
        variant="chips"
        options={[
          'Very liberal',
          'Liberal',
          'Moderate',
          'Conservative',
          'Very conservative',
          'Progressive',
          'Libertarian',
          'Other',
          'Not sure',
          PNTS,
        ]}
      />
      <Banner icon="shield">
        GC never infers your political identity from activity. Only what you declare here counts.
      </Banner>
    </Screen>
  )
}

export function Civic() {
  const { data, set, submit } = useFlow()
  const { issues } = data

  function move(i: number, by: number) {
    const ranked = [...issues]
    ;[ranked[i], ranked[i + by]] = [ranked[i + by], ranked[i]]
    set({ issues: ranked })
  }

  return (
    <Screen
      bar="Civic profile"
      progress={['Civic', 7, 9]}
      heading="Optional: civic profile"
      sub="Helps GC show you relevant legislation and discussions."
      row
      footer={skipRow(() =>
        submit({ engagement: '', votingFrequency: '', elections: [], news: '', participation: [], issues: [] }),
      )}
    >
      <Choices
        legend="How politically engaged are you?"
        name="engagement"
        variant="segmented"
        options={['Extremely', 'Very', 'Somewhat', 'Slightly', { value: 'Not engaged', label: 'Not' }]}
      />
      <Select
        label="Voting frequency"
        name="votingFrequency"
        options={['Every election', 'Most elections', 'Some elections', 'Rarely', 'Never', 'Not eligible', PNTS]}
        placeholder="Select…"
      />
      <Choices
        legend="Elections you take part in"
        name="elections"
        multi
        variant="chips"
        options={['Presidential', 'Congressional', 'State', 'Local', 'Primaries', 'Special', 'Ballot measures']}
      />
      <Select
        label="Political news use"
        name="news"
        options={['Daily', 'Several times a week', 'Weekly', 'Occasionally', 'Rarely', 'Never']}
        placeholder="Select…"
      />
      <Choices
        legend="Civic participation"
        name="participation"
        multi
        variant="chips"
        options={[
          'Contacted officials',
          'Town halls',
          'Volunteering',
          'Donations',
          'Petitions',
          'Advocacy',
          'Protests',
          'Other',
        ]}
      />
      <Choices
        legend="Top issues"
        name="issues"
        multi
        variant="chips"
        options={ISSUES}
      />
      {issues.length > 0 && (
        <fieldset>
          {/* Arrows instead of drag: WCAG 2.5.7 needs a non-dragging way to reorder. */}
          <legend>Your top three priorities (use the arrows to rank)</legend>
          <ol className="rank">
            {issues.slice(0, 3).map((issue, i) => (
              <li key={issue}>
                <span className="badge" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{issue}</span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${issue} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <Icon name="up" />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${issue} down`}
                  disabled={i === issues.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <Icon name="down" />
                </button>
              </li>
            ))}
          </ol>
        </fieldset>
      )}
      <Banner icon="info">Issue-by-issue positions come later, inside each issue page — not during signup.</Banner>
    </Screen>
  )
}

const USES = [
  ['Personalization', 'Use profile info to personalize your GC experience.'],
  ['Civic research', 'Use eligible info for civic / political research and analysis.'],
  ['Aggregated analytics', 'Include me in aggregated demographic and audience analysis.'],
  ['Advertising personalization', 'Control use for personalized advertising.'],
  ['Political / campaign advertising', 'Separate control — only where offered and permitted.'],
  ['Third-party data use', 'Sharing, sale or other third-party use. Off by default.'],
]

export function Privacy() {
  const { data } = useFlow()
  return (
    <Screen
      bar="Data & privacy"
      progress={['Privacy', 8, 9]}
      heading="How GC may use your optional info"
      sub="Core account data is used only to run your account. Everything below is your call and can be changed anytime."
      footer={<button className="btn primary">Save preferences</button>}
    >
      <div>
        {USES.map(([label, desc]) => (
          <label className="toggle" key={label}>
            <span>
              <b>{label}</b>
              <small>{desc}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="uses"
              value={label}
              defaultChecked={data.uses.includes(label)}
            />
          </label>
        ))}
      </div>
      <Choices
        legend="Profile visibility — what other GC users can see"
        name="visible"
        multi
        variant="chips"
        options={['Display name + district', 'Top issues', 'Party', 'Ideology', 'Demographics']}
        hint={`Default: only '${handle(data)}' is visible to others.`}
      />
    </Screen>
  )
}

const answered = (v: string | string[]) => (typeof v === 'string' ? v !== '' && v !== PNTS : v.length > 0 && v[0] !== PNTS)

export function Review() {
  const { data, submit, act } = useFlow()
  const module = moduleOf(data)
  const me = person(data)
  const enter = <button className="btn primary">Enter GC</button>
  const onSubmit = () => {
    // First time in: follow your representatives and chosen issues. Later visits keep what you follow.
    if (!data.contexts.includes('personal')) act({ following: defaultFollowing(data) })
    submit({ context: 'personal', contexts: [...new Set([...data.contexts, 'personal'])] })
  }

  if (module.observer)
    return (
      <Screen
        bar="Review"
        progress={['Review', 9, 9]}
        heading="You're set up as"
        sub="Observers can read, discuss and follow — with a few limits."
        onSubmit={onSubmit}
        footer={enter}
      >
        <Module eyebrow="GC CITIZEN · OBSERVER" name={module.name} tagline="No U.S. jurisdiction assigned" gray />
        <section className="section">
          <h2 className="label">What you can do</h2>
          <Caps
            items={[
              ['Public profile, posts, comments, messaging', true],
              ['Follow officials, candidates, committees, legislation', true],
              ['News, issues, voting records, election information', true],
              ['Create polls and join communities', true],
            ]}
          />
        </section>
        <section className="section">
          <h2 className="label">Conditional / not available</h2>
          <Caps
            items={[
              ['Constituent inquiry', false, 'Conditional — offices decide'],
              ['Assigned representatives', false, 'Not applicable'],
              ['Campaign tools', false, 'Conditional'],
            ]}
          />
        </section>
      </Screen>
    )

  const inUS = data.lives !== 'abroad'
  const reps = jurisdiction(data).reps.length
  const given = ['gender', 'race', ...DEMOGRAPHICS.map(([, name]) => name)].filter((k) => answered(data[k as keyof Data]))
  const political = [data.party, data.ideology].filter(answered)
  return (
    <Screen
      bar="Review"
      progress={['Review', 9, 9]}
      heading="You're set up as"
      sub="Here's the module you'll enter and what's public vs private."
      onSubmit={onSubmit}
      footer={
        <>
          {enter}
          <a className="btn ghost" href="#privacy">
            Review privacy settings
          </a>
        </>
      }
    >
      <Module
        eyebrow="GC CITIZEN"
        name={module.name}
        tagline="Learn → Discuss → Follow → Participate → Contact government"
      />
      <section className="section">
        <h2 className="label green">Public to other users</h2>
        <div className="card person">
          <Avatar initials={me.initials} />
          <span>
            <b>{handle(data)}</b>
            <small>
              Following: {reps ? `${reps} legislators · ` : ''}
              {data.issues.length} issues
            </small>
          </span>
        </div>
      </section>
      <section className="section">
        <h2 className="label red">Private — never shown</h2>
        <KV
          rows={[
            ['Full name', me.full],
            ['Address', inUS ? `${data.street}, ${data.city} ${data.state}` : data.country],
            ['Classification', CITIZENSHIP.find((c) => c.value === data.citizenship)?.label],
            [
              'Demographics',
              given.length === 0 ? 'Not provided' : given.length < DEMOGRAPHICS.length + 2 ? 'Partially provided' : 'Provided',
            ],
            ['Political identity', political.join(' · ') || 'Not provided'],
            ['Date of birth', data.dob ? `Private (age band ${ageBand(age(data.dob))})` : 'Not provided'],
          ]}
        />
      </section>
    </Screen>
  )
}
