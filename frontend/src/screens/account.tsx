import { useEffect, useRef, useState } from 'react'
import { account, demoAccounts } from '../api.ts'
import { collect, useFlow } from '../flow.ts'
import { Banner, Choices, Field, Icon, Placeholder, Screen } from '../ui.tsx'

export function Welcome() {
  const { load } = useFlow()
  return (
    <Screen
      className="welcome"
      top={
        <div className="logo lg" aria-hidden="true">
          GC
        </div>
      }
      heading="Government & Citizens"
      sub="Connecting citizens. Strengthening democracy."
      footer={
        <>
          <p className="note">By continuing you agree to the Terms and Privacy Policy.</p>
          {/* A new account starts from a clean session, not on top of whoever was signed in. */}
          <a className="btn primary" href="#create-account" onClick={() => load()}>
            Create account
          </a>
          <a className="btn ghost" href="#sign-in">
            Sign in
          </a>
        </>
      }
    >
      <Placeholder label="hero illustration / capitol motif" tall />
    </Screen>
  )
}

export function CreateAccount() {
  const { data, submit } = useFlow()
  return (
    <Screen
      bar="Create account"
      progress={['Account', 1, 9]}
      heading="Create your GC account"
      sub="Your name, an email or phone, and a password or passkey."
      onSubmit={(p) => submit({ ...p, recovering: '' })}
      footer={
        <>
          <p className="note">
            Already have an account? <a href="#sign-in">Sign in</a>
          </p>
          <button className="btn primary">Continue</button>
        </>
      }
    >
      <div className="grid2">
        <Field label="First name" name="firstName" autoComplete="given-name" required />
        <Field label="Middle initial (optional)" name="middleInitial" autoComplete="additional-name" maxLength={1} />
      </div>
      <Field label="Last name" name="lastName" autoComplete="family-name" required />
      <Field
        label="Email or phone"
        name="id"
        icon="mail"
        placeholder="you@example.com or +1 555 000 0000"
        autoComplete="username"
        required
      />
      {/* No name: the password never enters app state. */}
      <Field
        label="Password"
        icon="lock"
        type="password"
        placeholder="At least 12 characters"
        autoComplete="new-password"
        minLength={12}
        required
        hint="Use a passkey instead of a password."
      />
      <button
        type="button"
        className="btn secondary"
        onClick={(e) => {
          // A passkey replaces the password, so check every field except that one (it has no name).
          const form = e.currentTarget.form!
          const named = [...form.elements].filter((el) => el instanceof HTMLInputElement && el.name) as HTMLInputElement[]
          if (named.every((el) => el.reportValidity())) submit({ ...collect(form, data), recovering: '' })
        }}
      >
        <Icon name="key" />
        Continue with passkey
      </button>
      <hr />
      {/* Disabled until it is decided which third-party providers are allowed. */}
      <div className="grid2">
        <button type="button" className="btn secondary" disabled>
          Apple
        </button>
        <button type="button" className="btn secondary" disabled>
          Google
        </button>
      </div>
    </Screen>
  )
}

const RESEND_SECONDS = 45

export function Verify() {
  const { data } = useFlow()
  const [code, setCode] = useState('')
  const [wait, setWait] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (!wait) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  return (
    <Screen
      bar="Verify"
      progress={data.recovering ? undefined : ['Account', 1, 9]}
      heading="Confirm it's you"
      sub={`Enter the 6-digit code sent to ${data.id || 'you'}`}
      footer={
        <>
          <button className="btn primary">Verify</button>
          <button type="button" className="btn ghost" onClick={() => history.back()}>
            Use a different email or phone
          </button>
        </>
      }
    >
      <label className="otp">
        <span className="sr-only">6-digit code</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          title="6-digit code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} aria-hidden="true" className={i === Math.min(code.length, 5) ? 'on' : undefined}>
            {code[i]}
          </span>
        ))}
      </label>
      <p className="sub">
        Didn't get it?{' '}
        {wait ? (
          `Resend in 0:${String(wait).padStart(2, '0')}`
        ) : (
          <button type="button" className="link" onClick={() => setWait(RESEND_SECONDS)}>
            Resend code
          </button>
        )}
      </p>
    </Screen>
  )
}

export function SignIn() {
  const { data, set, load } = useFlow()
  const id = useRef<HTMLInputElement>(null)

  // shortcut: no password is checked, and only the demo accounts and this browser session's own account
  // exist. Replace with the auth API.
  function signIn(value: string) {
    const found = account(value)
    const d = found?.data ?? (data.id === value.trim() ? data : undefined)
    const contexts = d?.contexts ?? []
    if (contexts.length === 0) {
      id.current!.setCustomValidity('No GC account matches that email or phone.')
      id.current!.reportValidity()
      return
    }
    // With both a personal and an office context, the switcher opens for the choice.
    const context = contexts.length > 1 ? '' : contexts[0]
    if (found) load({ ...found.data, context }, found.activity)
    else set({ context })
    location.assign(context === 'office' ? '#enter-workspace' : '#home')
  }

  return (
    <Screen
      bar="Sign in"
      heading="Welcome back"
      onSubmit={() => signIn(id.current!.value)}
      footer={
        <a className="btn ghost" href="#create-account">
          Create an account
        </a>
      }
    >
      {/* No name: typing here must not rewrite the id of the account already in this session. */}
      <Field
        ref={id}
        label="Email or phone"
        icon="mail"
        autoComplete="username"
        required
        defaultValue={data.id}
        onInput={(e) => e.currentTarget.setCustomValidity('')}
      />
      <Field label="Password" icon="lock" type="password" autoComplete="current-password" required />
      <a className="link end" href="#recovery">
        Forgot password?
      </a>
      <button className="btn primary">Sign in</button>
      <button
        type="button"
        className="btn secondary"
        onClick={() => id.current?.reportValidity() && signIn(id.current.value)}
      >
        <Icon name="key" />
        Sign in with passkey
      </button>
      <Banner icon="swap">If you hold a personal and an office account, you'll pick a context after sign-in.</Banner>
      <section className="section">
        <h2 className="label">Demo accounts</h2>
        <div className="grid3">
          {demoAccounts().map((a) => (
            <button type="button" className="btn small secondary" key={a.data.id} onClick={() => signIn(a.data.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </section>
    </Screen>
  )
}

export function Recovery() {
  const { submit } = useFlow()
  return (
    <Screen
      bar="Account recovery"
      heading="Recover your account"
      sub="We verify control of the account without revealing any private profile information."
      onSubmit={(p) => submit({ ...p, recovering: 'yes' })}
      footer={<button className="btn primary">Continue</button>}
    >
      <Field
        label="Email or phone on the account"
        name="id"
        icon="mail"
        placeholder="you@example.com"
        autoComplete="username"
        required
      />
      <Choices
        legend="How should we verify you?"
        name="recovery"
        required
        options={[
          'Send a code to my email',
          'Send a code to my phone',
          'Use a passkey on another device',
          'Use a backup code',
        ]}
      />
      <Banner icon="shield">
        We will never show demographic, political, address or classification data during recovery.
      </Banner>
    </Screen>
  )
}

export function AccountType() {
  const { data } = useFlow()
  return (
    <Screen
      bar="Account type"
      progress={['Type', 2, 9]}
      heading="How will you use GC?"
      sub="You can add another context later. Personal and official activity stay permission-separated."
      // Organization has no onboarding flow yet: it is set up on the web by an authorized admin.
      footer={
        <button className="btn primary" disabled={data.accountType === 'organization'}>
          Continue
        </button>
      }
    >
      <Choices
        legend="Account type"
        hideLegend
        name="accountType"
        variant="cards"
        required
        options={[
          {
            value: 'personal',
            label: 'Personal',
            desc: 'Citizens, residents, observers. Learn → Discuss → Follow → Participate → Contact government.',
            icon: 'people',
          },
          {
            value: 'government',
            label: 'Government / Office',
            desc: 'Elected officials, government officials and their staff. Requires office verification.',
            icon: 'gov',
          },
          {
            value: 'organization',
            label: 'Organization',
            desc: 'Agencies, firms, associations, nonprofits, campaigns. Set up on the web by an authorized admin.',
            icon: 'briefcase',
          },
        ]}
      />
    </Screen>
  )
}
