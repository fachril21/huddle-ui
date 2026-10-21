export interface GoogleAccount {
  readonly name: string
  readonly email: string
}

/**
 * Synthetic accounts for the prototype's Google account chooser. The last one sits outside the
 * allowed domains on purpose, so the rejection can be seen. Replace with the real Google flow.
 */
export const DEMO_GOOGLE_ACCOUNTS: readonly GoogleAccount[] = [
  { name: 'Fachril', email: 'fachril@dibimbing.id' },
  { name: 'Dewi Lestari', email: 'dewi.lestari@cakrawala.ac.id' },
  { name: 'Contoh Pribadi', email: 'contoh.pribadi@gmail.com' },
]
