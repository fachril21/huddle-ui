const MARK = 'data-pip-style'

/** Replace everything this module copied into the target with the opener's current styles. */
function copyOnce(target: Document): void {
  target.head.querySelectorAll(`[${MARK}]`).forEach((node) => node.remove())
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const css = Array.from(sheet.cssRules, (rule) => rule.cssText).join('\n')
      const style = target.createElement('style')
      style.setAttribute(MARK, '')
      style.textContent = css
      target.head.append(style)
    } catch {
      // A cross-origin sheet hides its rules; link it instead
      if (!sheet.href) continue
      const link = target.createElement('link')
      link.setAttribute(MARK, '')
      link.rel = 'stylesheet'
      link.href = sheet.href
      target.head.append(link)
    }
  }
}

/**
 * A new window starts with no styles, and CSS Modules live in the opener's document, so copy them across.
 * The opener's head is watched, so hot reloads and lazily loaded chunks reach the mini window too.
 * Returns a function that stops watching.
 */
export function mirrorStyles(target: Document): () => void {
  const base = target.createElement('base')
  base.href = document.baseURI
  target.head.append(base)
  copyOnce(target)
  const observer = new MutationObserver(() => copyOnce(target))
  observer.observe(document.head, { childList: true, subtree: true, characterData: true })
  return () => observer.disconnect()
}
