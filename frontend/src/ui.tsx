import { useEffect, useId, useRef, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { collect, PNTS, useFlow, type Data } from './flow.ts'

// Redrawn stand-ins: the wireframe icons could not be exported from Figma.
const ICONS = {
  back: 'M15 5l-7 7 7 7',
  'chev-r': 'M9 5l7 7-7 7',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  'arrow-r': 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  minus: 'M6 12h12',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 016 0v3',
  key: 'M16 8a3 3 0 11-6 0 3 3 0 016 0zM11 10.5L4 17.5V20h3v-2h2v-2h2l2.5-2.5',
  swap: 'M4 8h14l-3-3M20 16H6l3 3',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 19a6 6 0 0112 0M16 5.2a3 3 0 010 5.6M18 19a6 6 0 00-2-4.5',
  gov: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  briefcase: 'M3 8h18v11H3zM9 8V5h6v3M3 13h18',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5',
  pin: 'M12 21s-6-5.5-6-10.5a6 6 0 1112 0C18 15.5 12 21 12 21zM12 12.5a2 2 0 100-4 2 2 0 000 4z',
  phone: 'M7 3h10v18H7zM11 18h2',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  id: 'M3 6h18v12H3zM7 10.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM6 15c.5-1.5 4.5-1.5 5 0M14 10h4M14 14h4',
  alert: 'M12 4l9 16H3l9-16zM12 10v4M12 17v.5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  bell: 'M6 17v-6a6 6 0 1112 0v6l2 2H4l2-2zM10 21h4',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  chat: 'M4 5h16v11H9l-5 4V5z',
}
export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

type ScreenProps = {
  /** Top bar title. Omit for screens with no back button. */
  bar?: string
  progress?: [label: string, step: number, of: number]
  /** Rendered above the heading. */
  top?: ReactNode
  heading: string
  sub?: ReactNode
  className?: string
  children?: ReactNode
  footer?: ReactNode
  /** Lay the footer buttons out side by side. */
  row?: boolean
  onSubmit?: (patch: Partial<Data>) => void
}

/** One step: top bar, progress, heading, a form around the content, and the footer actions. */
export function Screen({ bar, progress, top, heading, sub, className, children, footer, row, onSubmit }: ScreenProps) {
  const { data, set, submit } = useFlow()
  const h1 = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = `${bar ?? heading} · GC`
    scrollTo(0, 0)
    h1.current?.focus({ preventScroll: true })
  }, [bar, heading])

  function change(e: FormEvent<HTMLFormElement>) {
    const t = e.target
    // "Prefer not to say" and the other answers in a multi-select cancel each other out.
    if (t instanceof HTMLInputElement && t.type === 'checkbox' && t.checked)
      for (const el of e.currentTarget.querySelectorAll<HTMLInputElement>(`input[name="${t.name}"]`))
        if (el !== t && (t.value === PNTS || el.value === PNTS)) el.checked = false
    set(collect(e.currentTarget, data))
  }

  return (
    <main className="screen">
      {bar && (
        <header className="bar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Back"
            onClick={() => (history.length > 1 ? history.back() : (location.hash = ''))}
          >
            <Icon name="back" />
          </button>
          {bar}
        </header>
      )}
      <form
        className={className ? `body ${className}` : 'body'}
        onChange={change}
        onSubmit={(e) => {
          e.preventDefault()
          ;(onSubmit ?? submit)(collect(e.currentTarget, data))
        }}
      >
        {progress && (
          <div className="progress">
            <div aria-hidden="true">
              {Array.from({ length: progress[2] }, (_, i) => (
                <i key={i} className={i < progress[1] ? 'on' : undefined} />
              ))}
            </div>
            <p>
              <span>{progress[0]}</span>
              <span>
                Step {progress[1]} of {progress[2]}
              </span>
            </p>
          </div>
        )}
        {top}
        <h1 ref={h1} tabIndex={-1}>
          {heading}
        </h1>
        {sub && <p className="sub">{sub}</p>}
        {children}
        {footer && <div className={row ? 'cta row' : 'cta'}>{footer}</div>}
      </form>
    </main>
  )
}

type FieldProps = { label: string; hint?: ReactNode; icon?: IconName; name?: keyof Data } & Omit<
  ComponentProps<'input'>,
  'name'
>

/** Labelled text input. With a `name` it starts from, and saves to, that field of the flow data. */
export function Field({ label, hint, icon, className, ...input }: FieldProps) {
  const id = useId()
  const { data } = useFlow()
  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label htmlFor={id}>{label}</label>
      <div className="control">
        {icon && <Icon name={icon} />}
        <input
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          defaultValue={input.name && (data[input.name] as string)}
          {...input}
        />
      </div>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  )
}

type SelectProps = {
  label: string
  name: keyof Data
  options: readonly (string | readonly [value: string, label: string])[]
  placeholder?: string
} & Omit<ComponentProps<'select'>, 'name'>

export function Select({ label, options, placeholder, ...select }: SelectProps) {
  const id = useId()
  const { data } = useFlow()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <select id={id} defaultValue={data[select.name] as string} {...select}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const [value, text] = typeof o === 'string' ? [o, o] : o
            return (
              <option key={value} value={value}>
                {text}
              </option>
            )
          })}
        </select>
      </div>
    </div>
  )
}

type Option = { value: string; label: string; desc?: string; icon?: IconName; disabled?: boolean }

type ChoicesProps = {
  legend: string
  hideLegend?: boolean
  name: keyof Data
  options: readonly (string | Option)[]
  /** Checkboxes instead of radios. */
  multi?: boolean
  variant?: 'rows' | 'cols' | 'chips' | 'segmented' | 'cards'
  required?: boolean
  hint?: string
}

/** A native radio or checkbox group; the variant only changes how it looks. */
export function Choices({ legend, hideLegend, name, options, multi, variant = 'rows', required, hint }: ChoicesProps) {
  const current = useFlow().data[name]
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : undefined}>{legend}</legend>
      <div className={`opts ${variant}`}>
        {options.map((o) => {
          const opt: Option = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <label className="choice" key={opt.value}>
              {opt.icon && (
                <span className="tile">
                  <Icon name={opt.icon} />
                </span>
              )}
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={name}
                value={opt.value}
                defaultChecked={typeof current === 'string' ? current === opt.value : current.includes(opt.value)}
                required={required && !multi}
                disabled={opt.disabled}
              />
              <span>
                {opt.desc ? (
                  <>
                    <b>{opt.label}</b>
                    <small>{opt.desc}</small>
                  </>
                ) : (
                  opt.label
                )}
              </span>
            </label>
          )
        })}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </fieldset>
  )
}

export function Banner({ icon, tone, children }: { icon: IconName; tone?: 'tint' | 'warn'; children: ReactNode }) {
  return (
    <p className={tone ? `banner ${tone}` : 'banner'}>
      <Icon name={icon} />
      {children}
    </p>
  )
}

/** Stand-in for artwork that has not been designed yet. */
export function Placeholder({ label, tall }: { label: string; tall?: boolean }) {
  return <div className={tall ? 'placeholder tall' : 'placeholder'}>{label}</div>
}

export function KV({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="card kv">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

type ModuleProps = { eyebrow: string; name: string; line?: string; tagline: string; gray?: boolean }

export function Module({ eyebrow, name, line, tagline, gray }: ModuleProps) {
  return (
    <section className={gray ? 'module gray' : 'module'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{name}</h2>
      {line && <p>{line}</p>}
      <p className="tagline">{tagline}</p>
    </section>
  )
}

/** Capability list: a check or a dash per row, with an optional status on the right. */
export function Caps({ items }: { items: readonly (readonly [label: string, ok: boolean, status?: string])[] }) {
  return (
    <ul className="caps">
      {items.map(([label, ok, status]) => (
        <li key={label} className={ok ? undefined : 'no'}>
          <Icon name={ok ? 'check' : 'minus'} />
          <span>
            {label}
            <span className="sr-only">{ok ? ' (available)' : ' (not available)'}</span>
          </span>
          {status && <small>{status}</small>}
        </li>
      ))}
    </ul>
  )
}

export function Avatar({ initials, verified, lg }: { initials?: string; verified?: boolean; lg?: boolean }) {
  return (
    <span className={lg ? 'avatar lg' : 'avatar'} aria-hidden="true">
      {initials ?? <Icon name="user" size={24} />}
      {verified && (
        <i>
          <Icon name="check" size={10} />
        </i>
      )}
    </span>
  )
}

type DialogProps = { open: boolean; title: string; sheet?: boolean; onClose: () => void; children: ReactNode }

export function Dialog({ open, title, sheet, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const d = ref.current!
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={sheet ? 'sheet' : undefined} aria-labelledby={id} onClose={onClose}>
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  )
}
