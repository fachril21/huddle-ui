import airHorn from './soundboard/air-horn.mp3?inline'
import ding from './soundboard/ding.mp3?inline'
import drumRoll from './soundboard/drum-roll.mp3?inline'
import jangkrik from './soundboard/jangkrik.mp3?inline'
import levelUp from './soundboard/level-up.mp3?inline'
import rimshot from './soundboard/rimshot.mp3?inline'
import sadTrombone from './soundboard/sad-trombone.mp3?inline'
import sorakPenonton from './soundboard/sorak-penonton.mp3?inline'
import tada from './soundboard/tada.mp3?inline'
import tepukTangan from './soundboard/tepuk-tangan.mp3?inline'
import whoosh from './soundboard/whoosh.mp3?inline'
import wow from './soundboard/wow.mp3?inline'

/** Soundboard audio as data URIs in its own lazy chunk, for the same reason as `soundData.ts`. Keys are `SOUNDS` ids. */
export const SOUNDBOARD_DATA: Readonly<Record<string, string>> = {
  clap: tepukTangan,
  drumroll: drumRoll,
  tada,
  wow,
  ding,
  horn: airHorn,
  rimshot,
  sad: sadTrombone,
  cricket: jangkrik,
  whoosh,
  cheer: sorakPenonton,
  levelup: levelUp,
}
