// Rola só o contêiner com barra de rolagem mais próximo (ou a janela), nunca os
// ancestrais com overflow: hidden. scrollIntoView rola todos eles e, no layout do
// app (AppShell com h-dvh + overflow-hidden no desktop), empurrava a casca inteira.

function contemRolagem(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el)
  return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight
}

export function scrollToElement(target: HTMLElement | null | undefined, offset = 16): void {
  if (!target) return
  let pai = target.parentElement
  while (pai && pai !== document.body && !contemRolagem(pai)) pai = pai.parentElement

  if (pai && pai !== document.body) {
    const topo = target.getBoundingClientRect().top - pai.getBoundingClientRect().top + pai.scrollTop - offset
    pai.scrollTo({ top: Math.max(0, topo), behavior: 'smooth' })
    return
  }
  const topo = target.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, topo), behavior: 'smooth' })
}
