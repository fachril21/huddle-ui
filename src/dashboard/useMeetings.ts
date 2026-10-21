import { useEffect, useReducer } from 'react'
import { meetingReducer } from './meetingStore'
import type { MeetingState } from './meetingStore'
import { loadCustomMeetings, saveCustomMeetings } from './meetingStorage'
import { buildSeed } from './seed'

function init(hostName?: string): MeetingState {
  return { meetings: [...buildSeed(new Date(), hostName), ...loadCustomMeetings()] }
}

/** Meeting list owned above the dashboard, so edits survive a trip into the lobby and room. */
export function useMeetings(hostName?: string) {
  const [state, dispatch] = useReducer(meetingReducer, hostName, init)
  useEffect(() => saveCustomMeetings(state.meetings), [state.meetings])
  return { meetings: state.meetings, dispatch }
}
