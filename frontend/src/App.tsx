import { useEffect, useState, useSyncExternalStore, type JSX } from 'react'
import { noActivity } from './api.ts'
import { FlowContext, initial, next, STEPS, type Flow, type Step } from './flow.ts'
import { AccountType, CreateAccount, Recovery, SignIn, Verify, Welcome } from './screens/account.tsx'
import { Community, Government, Home, Legislation, Messages } from './screens/citizen.tsx'
import {
  EnterWorkspace,
  GovAccount,
  GovApproval,
  GovOffice,
  GovReview,
  GovRole,
  GovVerify,
} from './screens/office.tsx'
import {
  Abroad,
  Address,
  Civic,
  Classification,
  Demographics,
  Jurisdiction,
  Political,
  Privacy,
  Review,
} from './screens/personal.tsx'
import { Office } from './screens/workspace.tsx'

const SCREENS: Record<Step, () => JSX.Element> = {
  welcome: Welcome,
  'create-account': CreateAccount,
  verify: Verify,
  'sign-in': SignIn,
  recovery: Recovery,
  'account-type': AccountType,
  classification: Classification,
  address: Address,
  abroad: Abroad,
  jurisdiction: Jurisdiction,
  demographics: Demographics,
  political: Political,
  civic: Civic,
  privacy: Privacy,
  review: Review,
  'gov-account': GovAccount,
  'gov-office': GovOffice,
  'gov-role': GovRole,
  'gov-verify': GovVerify,
  'gov-approval': GovApproval,
  'gov-review': GovReview,
  'enter-workspace': EnterWorkspace,
  home: Home,
  government: Government,
  legislation: Legislation,
  community: Community,
  messages: Messages,
  office: Office,
}

/** The context an account must hold to open each signed-in screen. */
const NEEDS: Partial<Record<Step, string>> = {
  home: 'personal',
  government: 'personal',
  legislation: 'personal',
  community: 'personal',
  messages: 'personal',
  office: 'office',
}

// shortcut: sessionStorage stands in for the account API, so a reload keeps the session but a closed tab
// does not. Save to the backend once there is one.
const KEY = 'gc'
function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return { data: { ...initial, ...saved.data }, me: { ...noActivity, ...saved.me } }
  } catch {
    return { data: initial, me: noActivity }
  }
}

// The URL hash is the current step, so links, the browser's back button and reloads all just work.
const onHash = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}
const isStep = (s: string): s is Step => (STEPS as readonly string[]).includes(s)

export default function App() {
  const hash = useSyncExternalStore(onHash, () => location.hash.slice(1))
  const [name, ...path] = hash.split('/')
  const [state, setState] = useState(restore)
  const { data, me } = state
  const asked = isStep(name) ? name : 'welcome'
  const step = NEEDS[asked] && !data.contexts.includes(NEEDS[asked]) ? 'welcome' : asked

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage is full or blocked: the session still works, it just will not survive a reload.
    }
  }, [state])

  const flow: Flow = {
    data,
    set: (patch) => setState((s) => ({ ...s, data: { ...s.data, ...patch } })),
    submit: (patch) => {
      const d = { ...data, ...patch }
      setState((s) => ({ ...s, data: d }))
      location.hash = next(step, d)
    },
    path,
    me,
    act: (patch) => setState((s) => ({ ...s, me: { ...s.me, ...patch } })),
    load: (d, a) => setState({ data: { ...initial, ...d }, me: { ...noActivity, ...a } }),
  }
  const Current = SCREENS[step]
  return (
    <FlowContext value={flow}>
      <Current key={step} />
    </FlowContext>
  )
}
