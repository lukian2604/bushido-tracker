import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { IconButton } from '@/components/ui/IconButton'
import { EditIcon, DeleteIcon, PlusIcon } from '@/components/ui/icons'
import {
  subscribeToCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  subscribeToItems,
  addItem,
  updateItem,
  markWatched,
  updateWatchedAt,
  deleteItem,
} from '@/services/watchlist-service'
import type { MediaType, WatchlistCategory, WatchlistItem, WatchlistStatus } from '@/lib/types'
import type { Timestamp } from 'firebase/firestore'

const STATUSES: WatchlistStatus[] = ['planToWatch', 'watching', 'completed', 'onHold', 'dropped']
const MEDIA_TYPES: MediaType[] = ['video', 'book', 'manga', 'audiobook', 'game']

const formatWatchedAt = (timestamp: Timestamp) => {
  const date = timestamp.toDate()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()} - ${hours}:${minutes}`
}

const toDatetimeLocal = (timestamp: Timestamp): string => {
  const d = timestamp.toDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = { title: '', year: '', studio: '', author: '', status: 'planToWatch' as WatchlistStatus }

export const WatchlistPage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { confirmDialog } = useModal()

  const [categories, setCategories] = useState<WatchlistCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | 'all'>('all')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const [newCategoryMediaType, setNewCategoryMediaType] = useState<MediaType>('video')
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; mediaType: MediaType } | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingWatchedAtId, setEditingWatchedAtId] = useState<string | null>(null)
  const [watchedAtInput, setWatchedAtInput] = useState('')

  useEffect(() => {
    if (!user) return
    return subscribeToCategories(user.uid, (nextCategories) => {
      setCategories(nextCategories)
      setActiveCategoryId((current) => {
        if (current && nextCategories.some((category) => category.id === current)) {
          return current
        }
        return nextCategories[0]?.id ?? null
      })
    })
  }, [user])

  useEffect(() => {
    if (!user || !activeCategoryId) {
      setItems([])
      return
    }
    return subscribeToItems(user.uid, activeCategoryId, setItems)
  }, [user, activeCategoryId])

  const activeCategory = categories.find((c) => c.id === activeCategoryId)
  const mediaType: MediaType = activeCategory?.mediaType || 'video'
  const hasAuthor = ['book', 'manga', 'audiobook'].includes(mediaType)
  const completedVerb = t(`watchlist.completedVerb.${mediaType}`)
  const studioLabel = t(`watchlist.studio.${mediaType}`)

  const getStatusLabel = (status: WatchlistStatus): string => {
    if (status === 'planToWatch') return t(`watchlist.planToWatch.${mediaType}`)
    if (status === 'watching') return t(`watchlist.watching.${mediaType}`)
    return t(`watchlist.status.${status}`)
  }

  const selectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId)
    setStatusFilter('all')
    setEditingItemId(null)
    setIsItemFormOpen(false)
    setForm(EMPTY_FORM)
    setEditingCategory(null)
    setEditingWatchedAtId(null)
  }

  const onCategorySubmit = async (event: FormEvent) => {
    event.preventDefault()
    const name = categoryInput.trim()
    if (!user || !name) return
    await createCategory(user.uid, name, newCategoryMediaType)
    setCategoryInput('')
    setNewCategoryMediaType('video')
  }

  const onStartEditCategory = (category: WatchlistCategory) => {
    setEditingCategory({ id: category.id, name: category.name, mediaType: category.mediaType || 'video' })
  }

  const onSaveEditCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !editingCategory) return
    const name = editingCategory.name.trim()
    if (!name) return
    await updateCategory(user.uid, editingCategory.id, { name, mediaType: editingCategory.mediaType })
    setEditingCategory(null)
  }

  const onDeleteCategory = async (categoryId: string) => {
    if (!user) return
    if (await confirmDialog(t('watchlist.confirmDeleteCategory'))) {
      await deleteCategory(user.uid, categoryId)
    }
  }

  const onItemSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !activeCategoryId) return

    if (editingItemId) {
      await updateItem(user.uid, activeCategoryId, editingItemId, form)
    } else {
      await addItem(user.uid, activeCategoryId, form)
    }

    setForm(EMPTY_FORM)
    setEditingItemId(null)
    setIsItemFormOpen(false)
  }

  const onOpenAddItem = () => {
    setForm(EMPTY_FORM)
    setEditingItemId(null)
    setIsItemFormOpen(true)
  }

  const onCancelItemForm = () => {
    setForm(EMPTY_FORM)
    setEditingItemId(null)
    setIsItemFormOpen(false)
  }

  const onEditItem = (item: WatchlistItem) => {
    setForm({ title: item.title, year: item.year, studio: item.studio, author: item.author || '', status: item.status })
    setEditingItemId(item.id)
    setIsItemFormOpen(true)
  }

  const onDeleteItem = async (itemId: string) => {
    if (!user || !activeCategoryId) return
    if (await confirmDialog(t('watchlist.confirmDeleteItem'))) {
      await deleteItem(user.uid, activeCategoryId, itemId)
    }
  }

  const onStartEditWatchedAt = (item: WatchlistItem) => {
    if (!item.watchedAt) return
    setEditingWatchedAtId(item.id)
    setWatchedAtInput(toDatetimeLocal(item.watchedAt))
  }

  const onSaveWatchedAt = async (itemId: string) => {
    if (!user || !activeCategoryId) return
    const date = watchedAtInput ? new Date(watchedAtInput) : null
    await updateWatchedAt(user.uid, activeCategoryId, itemId, date)
    setEditingWatchedAtId(null)
  }

  const filteredItems = useMemo(
    () => (statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  )

  const statusOptions = STATUSES.map((status) => ({ value: status, label: getStatusLabel(status) }))

  const mediaTypePills = (selected: MediaType, onSelect: (type: MediaType) => void) =>
    MEDIA_TYPES.map((type) => (
      <button
        key={type}
        type="button"
        onClick={() => onSelect(type)}
        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
          selected === type
            ? 'border-(--color-gold) text-(--color-gold)'
            : 'border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-parchment-muted)'
        }`}
      >
        {t(`watchlist.mediaType.${type}`)}
      </button>
    ))

  return (
    <div>
      <PageHeader title={t('watchlist.heading')} subtitle={t('watchlist.subtitle')} />

      <form onSubmit={onCategorySubmit} className="mb-3 flex gap-3">
        <Field
          containerClassName="flex-grow"
          placeholder={t('watchlist.newCategoryPlaceholder')}
          value={categoryInput}
          onChange={(event) => setCategoryInput(event.target.value)}
          required
        />
        <Button type="submit">{t('watchlist.addCategoryButton')}</Button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {mediaTypePills(newCategoryMediaType, setNewCategoryMediaType)}
      </div>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('watchlist.emptyCategories')}</p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.id}
              className={`inline-flex items-center overflow-hidden rounded-full border bg-(--color-ink) ${
                category.id === activeCategoryId ? 'border-(--color-gold)' : 'border-(--color-border)'
              }`}
            >
              <button
                type="button"
                onClick={() => selectCategory(category.id)}
                className={`px-3.5 py-2 text-sm ${category.id === activeCategoryId ? 'text-(--color-gold)' : 'text-(--color-parchment-muted)'}`}
              >
                {category.name}
              </button>
              <IconButton variant="edit" onClick={() => onStartEditCategory(category)} aria-label={t('common.edit')}>
                <EditIcon className="size-3.5" />
              </IconButton>
              <IconButton variant="delete" onClick={() => onDeleteCategory(category.id)} aria-label={t('common.delete')} className="mr-1">
                <DeleteIcon className="size-3.5" />
              </IconButton>
            </span>
          ))}
        </div>
      )}

      {editingCategory && (
        <form onSubmit={onSaveEditCategory} className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-4">
          <h3 className="mb-3 font-accent text-sm font-semibold text-(--color-parchment)">{t('watchlist.editCategoryTitle')}</h3>
          <div className="mb-3 flex gap-3">
            <Field
              containerClassName="flex-grow"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory((curr) => curr ? { ...curr, name: e.target.value } : null)}
              required
            />
            <Button type="submit">{t('common.save')}</Button>
            <Button type="button" variant="ghost" onClick={() => setEditingCategory(null)}>{t('common.cancel')}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mediaTypePills(editingCategory.mediaType, (type) =>
              setEditingCategory((curr) => curr ? { ...curr, mediaType: type } : null),
            )}
          </div>
        </form>
      )}

      {activeCategoryId && !isItemFormOpen && (
        <Button onClick={onOpenAddItem} className="mb-6">
          <PlusIcon className="size-4" />
          {t('watchlist.addItemButton')}
        </Button>
      )}

      {activeCategoryId && isItemFormOpen && (
        <div className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">
            {editingItemId ? t('watchlist.editItemTitle') : t('watchlist.addItemTitle')}
          </h2>
          <form onSubmit={onItemSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('watchlist.titleLabel')}
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <Field
              label={t('watchlist.yearLabel')}
              value={form.year}
              onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
            />
            {hasAuthor && (
              <Field
                label={t('watchlist.authorLabel')}
                value={form.author}
                onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              />
            )}
            <Field
              label={studioLabel}
              value={form.studio}
              onChange={(event) => setForm((current) => ({ ...current, studio: event.target.value }))}
            />
            <CustomSelect
              label={t('watchlist.statusLabel')}
              value={form.status}
              onChange={(value) => setForm((current) => ({ ...current, status: value as WatchlistStatus }))}
              options={statusOptions}
            />
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit">
                {editingItemId ? t('watchlist.updateItemButton') : t('watchlist.addItemButton')}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancelItemForm}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeCategoryId && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', ...STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${
                  statusFilter === status
                    ? 'border-(--color-gold) text-(--color-gold)'
                    : 'border-(--color-border) text-(--color-parchment-muted)'
                }`}
              >
                {status === 'all' ? t('watchlist.statusFilterAll') : getStatusLabel(status)}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('watchlist.emptyItems')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      t('watchlist.tableTitle'),
                      t('watchlist.tableYear'),
                      ...(hasAuthor ? [t('watchlist.authorLabel')] : []),
                      studioLabel,
                      t('watchlist.tableStatus'),
                      completedVerb,
                      '',
                    ].map((label, index) => (
                      <th key={index} className="border-b border-(--color-border) p-3 text-left text-xs font-semibold uppercase tracking-wide text-(--color-ink-40)">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-(--color-border) p-3 text-sm font-medium text-(--color-parchment)">{item.title}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.year || '—'}</td>
                      {hasAuthor && (
                        <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.author || '—'}</td>
                      )}
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.studio || '—'}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{getStatusLabel(item.status)}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!item.watchedAt}
                            onChange={(event) => {
                              markWatched(user!.uid, activeCategoryId, item.id, event.target.checked)
                              if (!event.target.checked) setEditingWatchedAtId(null)
                            }}
                          />
                          {item.watchedAt ? (
                            editingWatchedAtId === item.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="datetime-local"
                                  value={watchedAtInput}
                                  onChange={(e) => setWatchedAtInput(e.target.value)}
                                  className="rounded-lg border border-(--color-border) bg-(--color-ink) px-2 py-1 text-xs text-(--color-parchment) outline-none focus:border-(--color-accent)"
                                />
                                <button
                                  type="button"
                                  onClick={() => onSaveWatchedAt(item.id)}
                                  className="text-sm font-semibold text-(--color-accent-green) hover:opacity-80"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingWatchedAtId(null)}
                                  className="text-sm text-(--color-ink-40) hover:text-(--color-parchment-muted)"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onStartEditWatchedAt(item)}
                                className="text-left text-sm text-(--color-parchment-muted) hover:text-(--color-parchment)"
                              >
                                {completedVerb}: {formatWatchedAt(item.watchedAt)}
                              </button>
                            )
                          ) : (
                            <span className="text-sm text-(--color-ink-40)">{t(`watchlist.markLabel.${mediaType}`)}</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-(--color-border) p-3">
                        <div className="flex gap-1">
                          <IconButton variant="edit" onClick={() => onEditItem(item)} aria-label={t('common.edit')}>
                            <EditIcon className="size-4" />
                          </IconButton>
                          <IconButton variant="delete" onClick={() => onDeleteItem(item.id)} aria-label={t('common.delete')}>
                            <DeleteIcon className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
