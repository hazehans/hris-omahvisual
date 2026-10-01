/**
 * Random stage background for each browser tab/session.
 * Images live under public/backgrounds/.
 *
 * Override the session key via VITE_BG_SESSION_KEY if multiple apps share a host.
 */

export const BACKGROUND_IMAGES = [
  '1.jpg',
  '2.jpg',
  '3.jpg',
  '4.jpg',
  '5.jpg',
  '5.jpeg',
  '6.jpeg',
  '7.jpeg',
  '8.jpeg',
  '9.jpeg',
  '10.jpeg',
  '11.jpeg',
  '12.jpeg',
  '13.jpeg',
  '14.jpeg',
  '15.jpeg',
  '16.jpeg',
  '17.jpeg',
  '18.jpeg',
] as const

const SESSION_KEY = import.meta.env.VITE_BG_SESSION_KEY || 'liquid-glass-bg-image'

function pickRandomBackground(): string {
  const index = Math.floor(Math.random() * BACKGROUND_IMAGES.length)
  return BACKGROUND_IMAGES[index] ?? BACKGROUND_IMAGES[0]
}

/** Choose one background per browser tab/session and apply it to the document. */
export function applyRandomBackground(): string {
  let filename: string | null = null
  try {
    filename = window.sessionStorage.getItem(SESSION_KEY)
  } catch {
    filename = null
  }

  if (!filename || !BACKGROUND_IMAGES.includes(filename as (typeof BACKGROUND_IMAGES)[number])) {
    filename = pickRandomBackground()
    try {
      window.sessionStorage.setItem(SESSION_KEY, filename)
    } catch {
      // sessionStorage may be unavailable; still apply for this page load.
    }
  }

  const url = `/backgrounds/${filename}`
  const root = document.documentElement
  root.style.setProperty('--app-bg-image', `url("${url}")`)
  root.dataset.bgImage = filename
  return url
}
