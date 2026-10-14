import { MAX_STROKES, isExpired } from '../../features/annotation/annotationMath'
import { canManage, nextId, roleOf } from './shared'
import type { Slice } from './shared'

/** Scribbles on the shared screen: anyone may draw while the host allows it; erasing others' ink is for host and co-host. */
export const annotationSlice: Slice = (state, action) => {
  const { allowed, strokes } = state.annotation
  switch (action.type) {
    case 'annotationAdd': {
      const role = roleOf(state, action.stroke.authorId)
      if (state.sharerId === null || !role || (!allowed && !canManage(role))) return state
      const stroke = { ...action.stroke, id: nextId(strokes) }
      return { ...state, annotation: { allowed, strokes: [...strokes, stroke].slice(-MAX_STROKES) } }
    }
    case 'annotationErase': {
      const target = strokes.find((s) => s.id === action.id)
      const role = roleOf(state, action.byId)
      if (!target || !role || (target.authorId !== action.byId && !canManage(role))) return state
      return { ...state, annotation: { allowed, strokes: strokes.filter((s) => s.id !== action.id) } }
    }
    case 'annotationUndo': {
      const last = [...strokes].reverse().find((s) => s.authorId === action.byId)
      return last ? { ...state, annotation: { allowed, strokes: strokes.filter((s) => s.id !== last.id) } } : state
    }
    case 'annotationClear': {
      const role = roleOf(state, action.byId)
      if (!role || !strokes.length) return state
      return { ...state, annotation: { allowed, strokes: canManage(role) ? [] : strokes.filter((s) => s.authorId !== action.byId) } }
    }
    case 'annotationAllow':
      return { ...state, annotation: { allowed: action.on, strokes } }
    case 'annotationExpire': {
      const alive = strokes.filter((s) => !isExpired(s, action.now))
      return alive.length === strokes.length ? state : { ...state, annotation: { allowed, strokes: alive } }
    }
    default:
      return undefined
  }
}
