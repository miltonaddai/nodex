import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Loader2, Pencil, Plus, Send, Trash2, X, Zap } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Seo } from '@/components/Seo'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { RuleEditor, draftsFrom, readDrafts, type DraftRule } from '@/components/dashboard/RuleEditor'
import { Toggle } from '@/components/ui/toggle'
import { describeRule, type Alert } from '@/lib/custom-filters'
import { playChime } from '@/lib/chime'
import { cn } from '@/lib/utils'
import { useAlertsStore } from '@/stores/alertsStore'
import { useEarlySignalStore } from '@/stores/earlySignalStore'
import { useTelegramStore } from '@/stores/telegramStore'

const CHAINS = [
  { id: 'solana', label: 'Solana' },
  { id: 'robinhood', label: 'Robinhood' },
  { id: 'bsc', label: 'BNB' },
]
const ALL_CHAINS = CHAINS.map((chain) => chain.id)
const MAX_ENABLED = 10

const button = 'inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50'
const primaryButton = cn(button, 'bg-whalemo-accent text-whalemo-on-accent hover:brightness-110')
const secondaryButton = cn(button, 'border border-whalemo-line bg-whalemo-surface hover:border-whalemo-teal/50')
const iconButton = 'flex h-9 w-9 items-center justify-center border border-whalemo-line text-whalemo-muted transition-colors'

function ChainPicker({ value, onChange }: { value: string[]; onChange: (chains: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chains to watch">
      {CHAINS.map((chain) => {
        const on = value.includes(chain.id)
        return (
          <button
            key={chain.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              const next = on ? value.filter((id) => id !== chain.id) : [...value, chain.id]
              if (next.length) onChange(next) // An alert watches at least one chain.
            }}
            className={cn(
              'border px-3 py-1.5 text-sm transition-colors',
              on ? 'border-whalemo-teal/50 bg-whalemo-teal/10 text-whalemo-teal' : 'border-whalemo-line text-whalemo-muted hover:text-white'
            )}
          >
            {chain.label}
          </button>
        )
      })}
    </div>
  )
}

/** Create or edit an alert: name, conditions and chains. */
function AlertEditor({ editing, onClose }: { editing: Alert | null; onClose: () => void }) {
  const create = useAlertsStore((s) => s.create)
  const update = useAlertsStore((s) => s.update)
  const [name, setName] = useState(editing?.name ?? '')
  const [drafts, setDrafts] = useState<DraftRule[]>(() => draftsFrom(editing?.rules ?? []))
  const [chains, setChains] = useState<string[]>(editing?.chains ?? ALL_CHAINS)
  const [saving, setSaving] = useState(false)
  const { rules, invalid } = readDrafts(drafts)
  const ready = name.trim().length > 0 && rules.length > 0 && !invalid

  const save = async () => {
    if (!ready || saving) return
    setSaving(true)
    const ok = editing
      ? await update(editing.id, { name: name.trim(), rules, chains })
      : await create({ name: name.trim(), rules, chains, enabled: true, telegram: true })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="mb-8 border border-whalemo-teal/40 bg-whalemo-surface"
    >
      <div className="flex items-center justify-between border-b border-whalemo-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold">{editing ? `Edit "${editing.name}"` : 'New alert'}</h2>
          <p className="text-sm text-whalemo-muted">Get alerted when a token newly meets all of these conditions.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-whalemo-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            placeholder="e.g. Small caps the whales are piling into"
            className="glass-input h-10 w-full px-3 text-sm sm:max-w-md"
          />
        </label>
        <div>
          <span className="mb-3 block text-sm font-semibold">Conditions</span>
          <RuleEditor drafts={drafts} onChange={setDrafts} onSubmit={() => void save()} />
        </div>
        <div>
          <span className="mb-2 block text-sm font-semibold">Watch on</span>
          <ChainPicker value={chains} onChange={setChains} />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-whalemo-line px-5 py-4 sm:px-6">
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" onClick={() => void save()} disabled={!ready || saving} className={primaryButton}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create alert'}
        </button>
      </div>
    </motion.section>
  )
}

/** Connects a Telegram chat, so alerts reach the user even with WhaleMo closed. */
function TelegramCard() {
  const { loaded, configured, linked, username, waiting, pendingUrl, connect, disconnect } = useTelegramStore()
  if (!loaded || !configured) return null

  return (
    <section className="mb-10 flex flex-col gap-4 border border-whalemo-line bg-whalemo-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#229ED9]/15 text-[#229ED9]">
          <Send className="h-5 w-5" />
        </span>
        <div>
          <div className="font-semibold">
            {linked ? `Telegram connected${username ? ` · @${username}` : ''}` : 'Get alerts on Telegram'}
          </div>
          <p className="mt-1 max-w-xl text-sm text-whalemo-muted">
            {linked
              ? 'Alerts with Telegram on are sent to your chat after each data update, even when WhaleMo is closed.'
              : waiting
                ? 'Press Start in the Telegram chat that just opened. This page updates once you do.'
                : 'Receive your alerts in Telegram after each data update, even when WhaleMo is closed.'}
          </p>
          {waiting && pendingUrl ? (
            <a href={pendingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-whalemo-teal hover:underline">
              Didn&apos;t open? Open Telegram
            </a>
          ) : null}
        </div>
      </div>
      {linked ? (
        <button type="button" onClick={() => void disconnect()} className={cn(secondaryButton, 'hover:border-whalemo-red/50 hover:text-whalemo-red')}>
          Disconnect
        </button>
      ) : (
        <button type="button" onClick={() => void connect()} disabled={waiting} className={cn(button, 'bg-[#229ED9] text-white hover:brightness-110')}>
          {waiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {waiting ? 'Waiting for Telegram…' : 'Connect Telegram'}
        </button>
      )}
    </section>
  )
}

/** A small Telegram on/off button for one alert. */
function TelegramSwitch({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={label}
      title={on ? 'Sent to Telegram. Click to stop.' : 'Not sent to Telegram. Click to send.'}
      className={cn(
        iconButton,
        on ? 'border-[#229ED9]/50 bg-[#229ED9]/10 text-[#229ED9]' : 'hover:border-[#229ED9]/50 hover:text-[#229ED9]'
      )}
    >
      <Send className="h-4 w-4" />
    </button>
  )
}

export function AlertsPage() {
  const alerts = useAlertsStore((s) => s.list)
  const loaded = useAlertsStore((s) => s.loaded)
  const failed = useAlertsStore((s) => s.failed)
  const update = useAlertsStore((s) => s.update)
  const remove = useAlertsStore((s) => s.remove)
  const earlyEnabled = useEarlySignalStore((s) => s.alertsEnabled)
  const setEarlyEnabled = useEarlySignalStore((s) => s.setAlertsEnabled)
  // null: closed; 'new': creating; an alert: editing it.
  const [editor, setEditor] = useState<Alert | 'new' | null>(null)
  const enabledCount = alerts.filter((alert) => alert.enabled).length
  const telegramLinked = useTelegramStore((s) => s.linked)
  const telegramEarly = useTelegramStore((s) => s.earlySignals)
  const setTelegramEarly = useTelegramStore((s) => s.setEarlySignals)

  useEffect(() => {
    void useAlertsStore.getState().load()
    void useTelegramStore.getState().load()
  }, [])

  return (
    <PageLayout>
      <Seo title="Alerts" noindex />
      <Navbar variant="dashboard" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-28 pb-16 md:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Alerts</h1>
            <p className="mt-2 max-w-xl text-sm text-whalemo-muted">
              Alerts watch the smart-money data in the background, whatever you are looking at. In the browser they
              chime while WhaleMo is open; connect Telegram to get them anywhere. Table filters stay separate, so you
              can research freely. Sound and desktop notifications are in{' '}
              <Link to="/settings?tab=notifications" className="text-whalemo-teal hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
          {editor === null ? (
            <button type="button" onClick={() => setEditor('new')} className={primaryButton} disabled={failed}>
              <Plus className="h-4 w-4" />
              New alert
            </button>
          ) : null}
        </div>

        <TelegramCard />

        <AnimatePresence>
          {editor !== null ? (
            <AlertEditor
              key={editor === 'new' ? 'new' : editor.id}
              editing={editor === 'new' ? null : editor}
              onClose={() => setEditor(null)}
            />
          ) : null}
        </AnimatePresence>

        {/* Built in */}
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-whalemo-muted">Built in</h2>
        <div className="mb-10 flex items-center justify-between gap-4 border border-whalemo-line bg-whalemo-surface p-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-whalemo-amber/15 text-whalemo-amber">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold">Early signals</div>
              <p className="mt-1 text-sm text-whalemo-muted">
                Under $100K market cap, 2+ top traders buying, 24h volume at least 10× market cap, and traders have sold
                under 30% of what they bought. All chains.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
          {telegramLinked ? (
            <TelegramSwitch on={telegramEarly} onChange={(next) => void setTelegramEarly(next)} label="Send early signals to Telegram" />
          ) : null}
          <Toggle
            label="Early-signal alerts"
            checked={earlyEnabled}
            onChange={(next) => {
              setEarlyEnabled(next)
              if (next) playChime()
            }}
          />
          </div>
        </div>

        {/* The user's own */}
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-whalemo-muted">Your alerts</h2>
          {alerts.length ? (
            <span className="text-xs text-whalemo-muted">
              {enabledCount} of {MAX_ENABLED} on
            </span>
          ) : null}
        </div>

        {!loaded ? (
          <div className="space-y-2">
            <div className="h-24 animate-pulse bg-whalemo-surface" />
            <div className="h-24 animate-pulse bg-whalemo-surface" />
          </div>
        ) : failed ? (
          <p className="border border-whalemo-red/40 bg-whalemo-red/10 p-5 text-sm text-whalemo-red">
            Your alerts could not be loaded. Refresh the page to try again.
          </p>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-dashed border-whalemo-line px-6 py-12 text-center">
            <Bell className="h-8 w-8 text-whalemo-muted" />
            <div>
              <div className="font-semibold">No alerts yet</div>
              <p className="mt-1 max-w-sm text-sm text-whalemo-muted">
                Create one and WhaleMo will chime when a new token meets your conditions, like 3+ top traders in a token
                under $500K.
              </p>
            </div>
            {editor === null ? (
              <button type="button" onClick={() => setEditor('new')} className={primaryButton}>
                <Plus className="h-4 w-4" />
                Create your first alert
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-whalemo-line border border-whalemo-line bg-whalemo-surface">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold">
                    {alert.enabled ? (
                      <Bell className="h-4 w-4 shrink-0 fill-current text-whalemo-teal" />
                    ) : (
                      <BellOff className="h-4 w-4 shrink-0 text-whalemo-muted" />
                    )}
                    <span className={cn('truncate', !alert.enabled && 'text-whalemo-muted')}>{alert.name}</span>
                  </div>
                  <div className="mt-1.5 text-sm text-whalemo-muted">{alert.rules.map(describeRule).join(' · ')}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {alert.chains.map((chain) => (
                      <span key={chain} className="border border-whalemo-line px-1.5 py-0.5 text-whalemo-muted">
                        {CHAINS.find((c) => c.id === chain)?.label ?? chain}
                      </span>
                    ))}
                    <Link to={`/wallets?alert=${alert.id}&chain=${alert.chains[0]}`} className="ml-1 text-whalemo-teal hover:underline">
                      See current matches
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {telegramLinked ? (
                    <TelegramSwitch
                      on={alert.telegram}
                      onChange={(next) => void update(alert.id, { telegram: next })}
                      label={`Send ${alert.name} to Telegram`}
                    />
                  ) : null}
                  <button type="button" onClick={() => setEditor(alert)} aria-label={`Edit ${alert.name}`} title="Edit" className={cn(iconButton, 'hover:border-whalemo-teal/50 hover:text-whalemo-teal')}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(alert.id)}
                    aria-label={`Delete ${alert.name}`}
                    title="Delete"
                    className={cn(iconButton, 'hover:border-whalemo-red/50 hover:text-whalemo-red')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="mx-1 h-6 w-px bg-whalemo-line" />
                  <Toggle label={`Alert ${alert.name}`} checked={alert.enabled} onChange={(next) => void update(alert.id, { enabled: next })} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
