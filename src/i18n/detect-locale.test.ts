import { describe, it, expect, vi, afterEach } from 'vitest'
import { detectLocale, translate } from './index'

const withBrowserLanguage = (language: string) => vi.stubGlobal('navigator', { language })

afterEach(() => vi.unstubAllGlobals())

describe('detectLocale', () => {
  it('maps Brazilian Portuguese (and bare "pt") to pt, every other Portuguese variant to pt-PT', () => {
    withBrowserLanguage('pt-BR')
    expect(detectLocale()).toBe('pt')
    withBrowserLanguage('pt')
    expect(detectLocale()).toBe('pt')
    withBrowserLanguage('pt-PT')
    expect(detectLocale()).toBe('pt-PT')
    withBrowserLanguage('pt-AO')
    expect(detectLocale()).toBe('pt-PT')
  })

  it('keeps the two-letter behaviour for other languages', () => {
    withBrowserLanguage('it-IT')
    expect(detectLocale()).toBe('it')
    withBrowserLanguage('ko-KR')
    expect(detectLocale()).toBe('en')
  })
})

describe('pt-PT translations', () => {
  it('uses European vocabulary', () => {
    expect(translate('pt-PT', 'common.save')).toBe('Guardar')
    expect(translate('pt', 'common.save')).toBe('Salvar')
    expect(translate('pt-PT', 'login.passwordLabel')).toBe('Palavra-passe')
  })
})
