import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Lang = 'de' | 'en'
export const LANGS: Lang[] = ['de', 'en']

const LANG_KEY = 'home.lang'

// German is the house language; English stays one tap away. Per device.
function initialLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'de' || v === 'en') return v
  } catch {
    // storage blocked
  }
  return 'de'
}

const dict = {
  de: {
    title: 'Saugroboter',
    language: 'Sprache',
    loading: 'Wird geladen …',
    'loading.devices': 'Saugroboter werden geladen …',
    disconnected: 'Keine Verbindung',
    retry: 'Erneut verbinden',
    'conn.lost': 'Live-Verbindung unterbrochen',
    'conn.closed': 'Verbindung beendet – erneut verbinden …',
    'conn.error': 'Verbindungsfehler',
    'conn.parse': 'Daten vom Server nicht lesbar',
    'conn.failed': 'Keine Verbindung zum Server',
    online: 'Online',
    offline: 'Offline',
    home: 'Zuhause',
    away: 'Abwesend',
    'away.hint.home': 'Zuhause – tippen für Abwesend',
    'away.hint.away': 'Abwesend – tippen für Zuhause',
    logout: 'Abmelden',
    'logout.title': 'Abmelden',
    'logout.message': 'Du meldest dich bei Roborock ab. Danach brauchst du einen neuen Bestätigungscode per E-Mail.',
    cancel: 'Abbrechen',
    back: 'Zurück',
    save: 'Speichern',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    add: 'Hinzufügen',
    'waiting.status': 'Warte auf Status …',
    error: 'Fehler',
    'error.code': 'Fehler {code}',
    battery: 'Akku',
    fan: 'Saugstärke',
    mop: 'Wischmodus',
    water: 'Wassertank',
    'last.clean': 'Letzte Reinigung',
    area: 'Fläche',
    elapsed: 'Laufzeit',
    remaining: 'Restzeit',
    'done.at': 'Fertig um',
    progress: 'Fortschritt',
    'recorded': 'bisher ~{min} min',
    pause: 'Pause',
    dock: 'Zur Station',
    start: 'Starten',
    programs: 'Programme',
    'program.active': 'Läuft',
    'program.confirm.title': '„{name}“ starten?',
    'program.confirm.message': 'Der Saugroboter beginnt sofort mit diesem Programm.',
    'program.full': 'Komplettreinigung',
    'program.zone': 'Zonenreinigung',
    'program.segment': 'Raumreinigung',
    'program.rooms': 'Räume {rooms}',
    'program.id': 'Programm #{id}',
    settings: 'Einstellungen',
    controls: 'Steuerung',
    actions: 'Aktionen',
    maintenance: 'Wartung',
    'maint.ok': 'Alles in Ordnung',
    'maint.reset': 'Zähler zurücksetzen',
    'maint.reset.title': 'Zähler zurücksetzen',
    'maint.reset.message': 'Zähler für „{name}“ zurücksetzen? Nur nach dem Tauschen oder Reinigen des Teils.',
    'maint.reset.confirm': 'Zurücksetzen',
    'maint.hours': '{h} h in Betrieb',
    'maint.cycles': '{n} Entleerungen',
    'c.main_brush': 'Hauptbürste',
    'c.side_brush': 'Seitenbürste',
    'c.filter': 'Filter',
    'c.sensor': 'Sensoren',
    'c.dust_collection': 'Absaugstation',
    schedule: 'Zeitplan',
    'schedule.create': 'Zeitplan anlegen',
    'schedule.none.today': 'Heute nichts mehr geplant',
    'schedule.priority': 'Vorrang: Abwesend › Wochenende/Feiertag › Freier Tag › Normal',
    'schedule.provisioned': 'Vorgegeben',
    'schedule.delete.confirm': 'Diesen Zeitplan löschen? Ein vorgegebener Zeitplan wird dann wieder aktiv.',
    'schedule.noslots': 'Keine Zeiten',
    'schedule.add': 'Zeit hinzufügen',
    'schedule.active': 'Aktiv',
    'schedule.next': 'Als Nächstes',
    'schedule.in': 'in {t}',
    'schedule.scene': 'Programm',
    'schedule.unknownScene': 'Unbekannt ({id})',
    'schedule.action.start': 'Reinigung starten',
    'schedule.action.scene': 'Programm',
    'day.normal': 'Normal',
    'day.weekend': 'Wochenende',
    'day.free': 'Freier Tag',
    'day.notAtHome': 'Abwesend',
    map: 'Karte',
    'map.room': 'Raum {id}',
    'map.reset': 'Doppelklick setzt die Ansicht zurück',
    'map.blocks.show': 'Kartenblöcke anzeigen ({n})',
    'map.blocks.hide': 'Kartenblöcke ausblenden ({n})',
    'map.robot': 'Saugroboter',
    'map.dock': 'Station',
    'login.sub': 'Anmelden, um die Saugroboter zu verbinden',
    'login.intro': 'Wir schicken einen Bestätigungscode an die E-Mail-Adresse deines Roborock-Kontos.',
    'login.send': 'Code senden',
    'login.sending': 'Wird gesendet …',
    'login.enter': 'Gib den Code aus der E-Mail ein.',
    'login.code': 'Code',
    'login.signin': 'Anmelden',
    'login.resend': 'Code erneut senden',
    'login.done': 'Verbunden',
    'login.starting': 'Bridge startet …',
    'login.failed': 'Anmeldung fehlgeschlagen',
    'login.sendFailed': 'Code konnte nicht gesendet werden',
    // vacuum states
    'st.starting': 'Startet',
    'st.charger_disconnected': 'Ladestation getrennt',
    'st.idle': 'Bereit',
    'st.remote_control_active': 'Fernsteuerung',
    'st.cleaning': 'Reinigt',
    'st.returning_home': 'Fährt zur Station',
    'st.manual_mode': 'Manueller Modus',
    'st.charging': 'Lädt',
    'st.charging_problem': 'Ladeproblem',
    'st.paused': 'Pausiert',
    'st.spot_cleaning': 'Spot-Reinigung',
    'st.error': 'Fehler',
    'st.shutting_down': 'Fährt herunter',
    'st.updating': 'Update läuft',
    'st.docking': 'Dockt an',
    'st.going_to_target': 'Fährt zum Ziel',
    'st.zoned_cleaning': 'Zonenreinigung',
    'st.segment_cleaning': 'Raumreinigung',
    'st.emptying_dustbin': 'Entleert Staubbehälter',
    'st.washing_mop': 'Wäscht Mopp',
    'st.going_to_wash_mop': 'Fährt zum Moppwaschen',
    'st.in_call': 'Im Gespräch',
    'st.mapping': 'Kartiert',
    'st.fully_charged': 'Voll geladen',
    // fan speeds, mop modes, water
    'fan.off': 'Aus',
    'fan.quiet': 'Leise',
    'fan.balanced': 'Ausgewogen',
    'fan.turbo': 'Turbo',
    'fan.max': 'Max',
    'fan.max_plus': 'Max+',
    'fan.custom': 'Individuell',
    'mop.standard': 'Standard',
    'mop.deep': 'Gründlich',
    'mop.deep_plus': 'Gründlich+',
    'mop.fast': 'Schnell',
    'mop.custom': 'Individuell',
    'water.off': 'Aus',
    'water.mild': 'Wenig',
    'water.moderate': 'Mittel',
    'water.intense': 'Viel',
  },
  en: {
    title: 'Robot vacuum',
    language: 'Language',
    loading: 'Loading …',
    'loading.devices': 'Loading vacuums …',
    disconnected: 'Disconnected',
    retry: 'Reconnect',
    'conn.lost': 'Live connection lost',
    'conn.closed': 'Connection closed – reconnecting …',
    'conn.error': 'Connection error',
    'conn.parse': 'Could not read server data',
    'conn.failed': 'Failed to connect to server',
    online: 'Online',
    offline: 'Offline',
    home: 'Home',
    away: 'Away',
    'away.hint.home': 'At home – tap to set away',
    'away.hint.away': 'Away – tap to set at home',
    logout: 'Log out',
    'logout.title': 'Log out',
    'logout.message': 'You are about to log out from Roborock. You will need a new verification code sent to your email.',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    'waiting.status': 'Waiting for status …',
    error: 'Error',
    'error.code': 'Error {code}',
    battery: 'Battery',
    fan: 'Suction',
    mop: 'Mop mode',
    water: 'Water tank',
    'last.clean': 'Last clean',
    area: 'Area',
    elapsed: 'Elapsed',
    remaining: 'Remaining',
    'done.at': 'Done at',
    progress: 'Progress',
    'recorded': 'usually ~{min} min',
    pause: 'Pause',
    dock: 'Dock',
    start: 'Start',
    programs: 'Programs',
    'program.active': 'Running',
    'program.confirm.title': 'Start “{name}”?',
    'program.confirm.message': 'The vacuum starts this program right away.',
    'program.full': 'Full clean',
    'program.zone': 'Zone clean',
    'program.segment': 'Room clean',
    'program.rooms': 'Rooms {rooms}',
    'program.id': 'Program #{id}',
    settings: 'Settings',
    controls: 'Controls',
    actions: 'Actions',
    maintenance: 'Maintenance',
    'maint.ok': 'All good',
    'maint.reset': 'Reset counter',
    'maint.reset.title': 'Reset counter',
    'maint.reset.message': 'Reset the “{name}” counter? Only do this after replacing or cleaning the part.',
    'maint.reset.confirm': 'Reset',
    'maint.hours': '{h} h used',
    'maint.cycles': '{n} cycles',
    'c.main_brush': 'Main brush',
    'c.side_brush': 'Side brush',
    'c.filter': 'Filter',
    'c.sensor': 'Sensors',
    'c.dust_collection': 'Dust collection',
    schedule: 'Schedule',
    'schedule.create': 'Create schedule',
    'schedule.none.today': 'Nothing more planned today',
    'schedule.priority': 'Priority: Away › Weekend/Holiday › Free day › Normal',
    'schedule.provisioned': 'Provisioned',
    'schedule.delete.confirm': 'Delete this schedule? If a provisioned schedule exists, it becomes active again.',
    'schedule.noslots': 'No slots',
    'schedule.add': 'Add time slot',
    'schedule.active': 'Active',
    'schedule.next': 'Next',
    'schedule.in': 'in {t}',
    'schedule.scene': 'Program',
    'schedule.unknownScene': 'Unknown ({id})',
    'schedule.action.start': 'Start cleaning',
    'schedule.action.scene': 'Program',
    'day.normal': 'Normal',
    'day.weekend': 'Weekend',
    'day.free': 'Free day',
    'day.notAtHome': 'Away',
    map: 'Map',
    'map.room': 'Room {id}',
    'map.reset': 'Double-click resets the view',
    'map.blocks.show': 'Show map blocks ({n})',
    'map.blocks.hide': 'Hide map blocks ({n})',
    'map.robot': 'Vacuum',
    'map.dock': 'Dock',
    'login.sub': 'Sign in to connect your vacuums',
    'login.intro': 'A verification code will be sent to your Roborock account email.',
    'login.send': 'Send code',
    'login.sending': 'Sending …',
    'login.enter': 'Enter the code from the email.',
    'login.code': 'Code',
    'login.signin': 'Sign in',
    'login.resend': 'Resend code',
    'login.done': 'Connected',
    'login.starting': 'Starting bridge …',
    'login.failed': 'Login failed',
    'login.sendFailed': 'Failed to send code',
    'st.starting': 'Starting',
    'st.charger_disconnected': 'Charger disconnected',
    'st.idle': 'Idle',
    'st.remote_control_active': 'Remote control',
    'st.cleaning': 'Cleaning',
    'st.returning_home': 'Returning to dock',
    'st.manual_mode': 'Manual mode',
    'st.charging': 'Charging',
    'st.charging_problem': 'Charging problem',
    'st.paused': 'Paused',
    'st.spot_cleaning': 'Spot cleaning',
    'st.error': 'Error',
    'st.shutting_down': 'Shutting down',
    'st.updating': 'Updating',
    'st.docking': 'Docking',
    'st.going_to_target': 'Going to target',
    'st.zoned_cleaning': 'Zone cleaning',
    'st.segment_cleaning': 'Room cleaning',
    'st.emptying_dustbin': 'Emptying dustbin',
    'st.washing_mop': 'Washing mop',
    'st.going_to_wash_mop': 'Going to wash mop',
    'st.in_call': 'In call',
    'st.mapping': 'Mapping',
    'st.fully_charged': 'Fully charged',
    'fan.off': 'Off',
    'fan.quiet': 'Quiet',
    'fan.balanced': 'Balanced',
    'fan.turbo': 'Turbo',
    'fan.max': 'Max',
    'fan.max_plus': 'Max+',
    'fan.custom': 'Custom',
    'mop.standard': 'Standard',
    'mop.deep': 'Deep',
    'mop.deep_plus': 'Deep+',
    'mop.fast': 'Fast',
    'mop.custom': 'Custom',
    'water.off': 'Off',
    'water.mild': 'Mild',
    'water.moderate': 'Moderate',
    'water.intense': 'Intense',
  },
} satisfies Record<Lang, Record<string, string>>

export type Key = keyof (typeof dict)['de']

export interface I18n {
  lang: Lang
  locale: string
  setLang: (l: Lang) => void
  /** A UI string with {placeholders}. */
  t: (key: Key, vars?: Record<string, string | number>) => string
  /** A value from the device ("segment_cleaning") in a group ("st"), translated if known. */
  tv: (group: 'st' | 'fan' | 'mop' | 'water' | 'c' | 'day', value: string) => string
  /** A number in the current locale (8,5 in German). */
  num: (n: number, decimals?: number) => string
  /** "1 h 23 min", "12 min 5 s". */
  dur: (sec: number) => string
  /** 24h clock time, "14:05". */
  clock: (iso?: string) => string
}

const Ctx = createContext<I18n | null>(null)

/** "segment_cleaning" -> "Segment Cleaning", for values the dictionary does not know. */
export function prettify(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      // convenience only
    }
  }, [])

  const value = useMemo<I18n>(() => {
    const locale = lang === 'de' ? 'de-DE' : 'en-GB'
    document.documentElement.lang = lang
    const t: I18n['t'] = (key, vars) =>
      (dict[lang][key] ?? dict.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? ''))
    const tv: I18n['tv'] = (group, value) => {
      if (!value) return '–'
      const k = `${group}.${value}` as Key
      return k in dict[lang] ? t(k) : prettify(value)
    }
    const fmt = new Map<number, Intl.NumberFormat>()
    const num: I18n['num'] = (n, decimals = 0) => {
      let f = fmt.get(decimals)
      if (!f) {
        f = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        fmt.set(decimals, f)
      }
      return f.format(n)
    }
    const dur: I18n['dur'] = (sec) => {
      if (sec < 0 || !isFinite(sec)) return '–'
      const s = Math.round(sec)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
      if (m >= 10) return `${m} min`
      if (m > 0) return `${m} min ${s % 60} s`
      return `${s} s`
    }
    const clock: I18n['clock'] = (iso) => {
      if (!iso) return '–'
      const d = new Date(iso)
      if (isNaN(d.getTime())) return '–'
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return { lang, locale, setLang, t, tv, num, dur, clock }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside I18nProvider')
  return v
}
