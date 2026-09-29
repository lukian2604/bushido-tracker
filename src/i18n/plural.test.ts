import { describe, it, expect } from 'vitest'
import { translatePlural } from './index'

describe('translatePlural', () => {
  it('picks singular/plural by the language rules', () => {
    expect(translatePlural('en', 'common.days', 1)).toBe('day')
    expect(translatePlural('en', 'common.days', 5)).toBe('days')
    expect(translatePlural('it', 'common.days', 1)).toBe('giorno')
    expect(translatePlural('it', 'common.days', 2)).toBe('giorni')
  })

  it('handles Russian one/few/many forms', () => {
    expect(translatePlural('ru', 'common.days', 1)).toBe('день')
    expect(translatePlural('ru', 'common.days', 3)).toBe('дня')
    expect(translatePlural('ru', 'common.days', 5)).toBe('дней')
    expect(translatePlural('ru', 'common.days', 21)).toBe('день')
    expect(translatePlural('ru', 'common.days', 22)).toBe('дня')
  })

  it('uses the base form for languages without plural variants, never falling back to English', () => {
    expect(translatePlural('ja', 'common.days', 1)).toBe('日')
    expect(translatePlural('zh', 'common.days', 1)).toBe('天')
  })
})
