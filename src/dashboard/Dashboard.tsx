import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { copyText } from '../features/invite/clipboard'
import { buildInviteUrl } from '../features/invite/inviteLink'
import { Ambient } from '../room/Ambient'
import { useFx } from '../room/MotionContext'
import { insideSummary } from '../prejoin/MeetingInfo'
import { AgendaGroups } from './AgendaGroups'
import { CancelDialog } from './CancelDialog'
import { CommandBar } from './CommandBar'
import { MY_ROOM_CODE, MY_ROOM_TITLE, USER_NAME } from './constants'
import { matchDashboardShortcut } from './dashboardShortcuts'
import { useViewport } from '../mobile/useViewport'
import { Header } from './Header'
import { generateMeetingCode, parseJoinInput } from './meetingCode'
import type { MeetingActions } from './meetingActions'
import type { MeetingAction } from './meetingStore'
import { findByCode } from './meetingStore'
import { MeetingsPage } from './MeetingsPage'
import { NextMeeting } from './NextMeeting'
import { Rail } from './Rail'
import type { DashboardView } from './Rail'
import { ScheduleDialog } from './ScheduleDialog'
import { allOccurrences, buildInvitationText, dayLabel, formatTimeRange, groupByDay, occurrenceState, occurrencesBetween, pickNext, startOfDay } from './schedule'
import type { FormMode, FormSource, ScheduleResult } from './scheduleForm'
import { ShareDialog } from './ShareDialog'
import { TabBar } from './TabBar'
import { Toast } from './Toast'
import { useNow } from './useNow'
import type { JoinTarget, Meeting, Occurrence } from './types'
import ui from './ui.module.css'
import styles from './Dashboard.module.css'

interface DashboardProps {
  meetings: readonly Meeting[]
  dispatch: Dispatch<MeetingAction>
  onEnter: (target: JoinTarget) => void
}

type DialogState =
  | { kind: 'schedule'; mode: FormMode; source?: FormSource }
  | { kind: 'share'; heading: string; title: string; summary: string; link: string; invitation?: string; enter?: JoinTarget }
  | { kind: 'cancel'; occurrence: Occurrence }

const DAY_MS = 24 * 60 * 60 * 1000
const LOOK_BACK_DAYS = 30
const LOOK_AHEAD_DAYS = 60
const WEEK_DAYS = 7
const HOME_UPCOMING_ROWS = 6

const JOIN_ERRORS = {
  empty: 'Masukkan kode rapat dulu, contohnya abc-defg-hij.',
  format: 'Format kode belum tepat. Kode rapat seperti abc-defg-hij.',
  foreign: 'Tautan itu bukan tautan Huddle.',
} as const

function insideNote(o: Occurrence, now: Date): string {
  const state = occurrenceState(o, now)
  if (state === 'live') return insideSummary()
  if (o.meeting.isHost) return 'Anda yang pertama masuk'
  return `${o.meeting.hostName} akan segera membuka rapat`
}

/** Home and meetings pages. Owns dialogs, shortcuts and every way into the lobby. */
export function Dashboard({ meetings, dispatch, onEnter }: DashboardProps) {
  const { fx, reduced } = useFx()
  const { sizeClass, coarse } = useViewport()
  const phone = sizeClass === 'phone'
  const now = useNow()
  const [view, setView] = useState<DashboardView>('home')
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  // rooms made "for later" this session: they have a link but no schedule
  const [laterCodes, setLaterCodes] = useState<readonly string[]>([])
  const codeRef = useRef<HTMLInputElement>(null)

  const todayStart = startOfDay(now).getTime()
  const occurrences = useMemo(
    () => allOccurrences(meetings, new Date(todayStart - LOOK_BACK_DAYS * DAY_MS), new Date(todayStart + LOOK_AHEAD_DAYS * DAY_MS)),
    [meetings, todayStart],
  )

  const next = pickNext(occurrences, now)
  // what is left today comes first; finished sessions sink, and the session already in the strip is not repeated
  const todayAll = occurrences.filter((o) => o.start.getTime() >= todayStart && o.start.getTime() < todayStart + DAY_MS && o !== next)
  const today = [...todayAll.filter((o) => occurrenceState(o, now) !== 'ended'), ...todayAll.filter((o) => occurrenceState(o, now) === 'ended')]
  const thisWeek = occurrences.filter((o) => o.start.getTime() >= todayStart + DAY_MS && o.start.getTime() < todayStart + (WEEK_DAYS + 1) * DAY_MS)
  const upcoming = occurrences.filter((o) => occurrenceState(o, now) !== 'ended')
  const past = occurrences.filter((o) => occurrenceState(o, now) === 'ended').reverse()

  const say = (message: string) => setToast(message)
  const closeDialog = () => setDialog(null)
  const dismissToast = useCallback(() => setToast(null), [])

  /* ---------- ways into the lobby ---------- */

  const enterSession = (o: Occurrence) =>
    onEnter({ code: o.meeting.code, title: o.meeting.title, hostName: o.meeting.hostName, insideNote: insideNote(o, now) })

  const startInstant = () => onEnter({ code: generateMeetingCode(), title: 'Rapat dadakan', hostName: USER_NAME, insideNote: 'Anda yang pertama masuk' })
  const startMyRoom = () => onEnter({ code: MY_ROOM_CODE, title: MY_ROOM_TITLE, hostName: USER_NAME, insideNote: 'Anda yang pertama masuk' })

  const makeForLater = () => {
    const code = generateMeetingCode()
    setLaterCodes((codes) => [...codes, code])
    setDialog({
      kind: 'share',
      heading: 'Rapat siap dibagikan',
      title: 'Rapat baru',
      summary: 'Tautan ini bisa dipakai kapan saja. Rapat dimulai saat Anda masuk.',
      link: buildInviteUrl(code),
      enter: { code, title: 'Rapat baru', hostName: USER_NAME, insideNote: 'Anda yang pertama masuk' },
    })
  }

  const joinCode = (raw: string) => {
    const parsed = parseJoinInput(raw)
    if (parsed.kind !== 'ok') return setJoinError(JOIN_ERRORS[parsed.kind])
    const { code } = parsed
    if (code === MY_ROOM_CODE) return startMyRoom()
    const meeting = findByCode(meetings, code)
    if (meeting) {
      const session = occurrencesBetween(meeting, new Date(now.getTime() - DAY_MS), new Date(now.getTime() + LOOK_AHEAD_DAYS * DAY_MS)).find((o) => occurrenceState(o, now) !== 'ended')
      return onEnter({ code, title: meeting.title, hostName: meeting.hostName, insideNote: session ? insideNote(session, now) : 'Belum ada yang masuk' })
    }
    if (laterCodes.includes(code)) return onEnter({ code, title: 'Rapat baru', hostName: USER_NAME, insideNote: 'Anda yang pertama masuk' })
    setJoinError(`Rapat dengan kode ${code} tidak ditemukan. Periksa lagi kodenya.`)
  }

  /* ---------- scheduling ---------- */

  const openSchedule = () => setDialog({ kind: 'schedule', mode: 'create' })

  const save = (result: ScheduleResult) => {
    if (result.kind === 'create') dispatch({ type: 'add', meeting: result.meeting })
    else if (result.kind === 'series') dispatch({ type: 'update', id: result.id, patch: result.meeting })
    else dispatch({ type: 'editOccurrence', id: result.id, startIso: result.startIso, replacement: result.meeting })

    const end = new Date(result.start.getTime() + result.meeting.durationMin * 60_000)
    setDialog({
      kind: 'share',
      heading: result.kind === 'create' ? 'Rapat dijadwalkan' : 'Jadwal diperbarui',
      title: result.meeting.title,
      summary: `${dayLabel(result.start, now)}, ${formatTimeRange({ start: result.start, end })}`,
      link: buildInviteUrl(result.meeting.code),
      invitation: buildInvitationText(result.meeting, result.start),
    })
  }

  const confirmCancel = (o: Occurrence, scope: 'single' | 'series') => {
    if (scope === 'series') dispatch({ type: 'cancelSeries', id: o.meeting.id })
    else dispatch({ type: 'cancelOccurrence', id: o.meeting.id, startIso: o.start.toISOString() })
    closeDialog()
    say(`“${o.meeting.title}” dibatalkan`)
  }

  const copy = async (text: string, done: string) => say((await copyText(text)) ? done : 'Tidak bisa menyalin otomatis')

  const actions: MeetingActions = {
    enter: enterSession,
    copyInvitation: (o) => copy(buildInvitationText(o.meeting, o.start), 'Undangan disalin'),
    copyLink: (o) => copy(buildInviteUrl(o.meeting.code), 'Tautan disalin'),
    edit: (o) => setDialog({ kind: 'schedule', mode: 'edit', source: { meeting: o.meeting, occurrence: o } }),
    duplicate: (o) => setDialog({ kind: 'schedule', mode: 'duplicate', source: { meeting: o.meeting, occurrence: o } }),
    cancel: (o) => setDialog({ kind: 'cancel', occurrence: o }),
  }

  /* ---------- shortcuts ---------- */

  const latest = useRef({ startInstant, openSchedule, dialogOpen: dialog !== null, coarse })
  useEffect(() => {
    latest.current = { startInstant, openSchedule, dialogOpen: dialog !== null, coarse }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const hit = matchDashboardShortcut(e)
      // single-key shortcuts are for a keyboard; on a touch screen a stray letter should do nothing
      if (!hit || latest.current.dialogOpen || latest.current.coarse) return
      e.preventDefault()
      if (hit === 'instant') latest.current.startInstant()
      else if (hit === 'schedule') latest.current.openSchedule()
      else {
        setView('home')
        // the field may not be mounted yet when coming from the meetings page
        window.requestAnimationFrame(() => codeRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const homeSection = (id: string, title: string, count: number, children: ReactNode, aside?: ReactNode) => (
    <section aria-labelledby={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 id={id}>{title}</h2>
        <span>{count === 0 ? 'Kosong' : `${count} rapat`}</span>
        {aside}
      </div>
      {children}
    </section>
  )

  return (
    <div className={styles.screen} data-fx={fx} data-still={reduced || undefined} data-phone={phone || undefined}>
      <Ambient />
      {phone ? <TabBar view={view} onChange={setView} onSoon={(label) => say(`${label}: segera hadir`)} /> : <Rail view={view} onChange={setView} onSoon={(label) => say(`${label}: segera hadir`)} />}
      <main className={styles.main}>
        <div className={styles.column}>
          {view === 'home' ? (
            <>
              <Header now={now} />
              <CommandBar
                codeRef={codeRef}
                joinError={joinError}
                onClearError={() => setJoinError(null)}
                onJoinCode={joinCode}
                onInstant={startInstant}
                onLater={makeForLater}
                onSchedule={openSchedule}
                onStartMyRoom={startMyRoom}
                onCopyMyRoom={() => copy(buildInviteUrl(MY_ROOM_CODE), 'Tautan Room saya disalin')}
              />
              <NextMeeting occurrence={next} now={now} actions={actions} onSchedule={openSchedule} />
              {homeSection(
                'today-heading',
                'Hari ini',
                today.length,
                <AgendaGroups groups={groupByDay(today, now)} now={now} actions={actions} showDayLabels={false} empty={<p>{next ? 'Tidak ada rapat lain hari ini.' : 'Tidak ada rapat hari ini.'}</p>} />,
              )}
              {homeSection(
                'week-heading',
                'Mendatang',
                thisWeek.length,
                <AgendaGroups
                  groups={groupByDay(thisWeek.slice(0, HOME_UPCOMING_ROWS), now)}
                  now={now}
                  actions={actions}
                  showDayLabels
                  empty={<p>Belum ada rapat dalam seminggu ke depan.</p>}
                />,
                <button type="button" className={`${ui.btn} ${ui.small} ${styles.more}`} onClick={() => setView('meetings')}>
                  Lihat semua rapat
                </button>,
              )}
            </>
          ) : (
            <MeetingsPage upcoming={upcoming} past={past} now={now} actions={actions} onSchedule={openSchedule} />
          )}
        </div>
      </main>

      {dialog?.kind === 'schedule' && <ScheduleDialog mode={dialog.mode} now={now} source={dialog.source} onClose={closeDialog} onSave={save} />}
      {dialog?.kind === 'share' && (
        <ShareDialog
          heading={dialog.heading}
          title={dialog.title}
          summary={dialog.summary}
          link={dialog.link}
          invitation={dialog.invitation}
          primary={dialog.enter ? { label: 'Mulai sekarang', onClick: () => onEnter(dialog.enter as JoinTarget) } : undefined}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'cancel' && <CancelDialog occurrence={dialog.occurrence} now={now} onClose={closeDialog} onConfirm={(scope) => confirmCancel(dialog.occurrence, scope)} />}
      <Toast message={toast} onDone={dismissToast} />
    </div>
  )
}
