export const USER_NAME = 'Fachril'
/** Dashboard dates and times are shown in this zone. WIB has no DST, so a day is always 24h. */
export const DISPLAY_TZ = 'Asia/Jakarta'
export const MY_ROOM_CODE = 'fcr-hilz-uld'
export const MY_ROOM_TITLE = 'Room saya'
/** A meeting can be entered this long before it starts */
export const JOIN_WINDOW_MIN = 10
export const MAX_TITLE_LENGTH = 80
export const MAX_INVITEES = 100
export const DURATIONS_MIN = [15, 30, 45, 60, 90, 120, 180] as const
export const TIMEZONES = [
  { id: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
  { id: 'Asia/Makassar', label: 'WITA (Makassar)' },
  { id: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
  { id: 'Asia/Singapore', label: 'Singapura' },
  { id: 'UTC', label: 'UTC' },
] as const
