import { useState, useSyncExternalStore, type JSX } from 'react'
import { FlowContext, initial, next, STEPS, type Flow, type Step } from './flow.ts'
import { AccountType, CreateAccount, Recovery, SignIn, Verify, Welcome } from './screens/account.tsx'
import {
  EnterWorkspace,
  GovAccount,
  GovApproval,
  GovOffice,
  GovReview,
  GovRole,
  GovVerify,
  Home,
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
}

// The URL hash is the current step, so links, the browser's back button and reloads all just work.
const onHash = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}
const isStep = (s: string): s is Step => (STEPS as readonly string[]).includes(s)

export default function App() {
  const hash = useSyncExternalStore(onHash, () => location.hash.slice(1))
  const step = isStep(hash) ? hash : 'welcome'
  // ponytail: answers live in memory and are lost on reload. Persist once there is an API to save them to.
  const [data, setData] = useState(initial)

  const flow: Flow = {
    data,
    set: (patch) => setData((d) => ({ ...d, ...patch })),
    submit: (patch) => {
      const d = { ...data, ...patch }
      setData(d)
      location.hash = next(step, d)
    },
  }
  const Current = SCREENS[step]
  return (
    <FlowContext value={flow}>
      <Current key={step} />
    </FlowContext>
  )
}
