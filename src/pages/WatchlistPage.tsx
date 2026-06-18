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
  deleteItem,
} from '@/services/watchlist-service'
import type { WatchlistCategory, WatchlistItem, WatchlistStatus } from '@/lib/types'

const STATUSES: WatchlistStatus[] = ['planToWatch', 'watching', 'completed', 'onHold', 'dropped']

const formatWatchedAt = (timestamp: WatchlistItem['watchedAt']) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()} - ${hours}:${minutes}`
}

const EMPTY_FORM = { title: '', year: '', studio: '', status: 'planToWatch' as WatchlistStatus }

export const WatchlistPage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { confirmDialog, promptDialog } = useModal()

  const [categories, setCategories] = useState<WatchlistCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | 'all'>('all')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [categoryInput, setCategoryInput] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

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

  const selectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId)
    setStatusFilter('all')
    setEditingItemId(null)
    setIsItemFormOpen(false)
    setForm(EMPTY_FORM)
  }

  const onCategorySubmit = async (event: FormEvent) => {
    event.preventDefault()
    const name = categoryInput.trim()
    if (!user || !name) return
    await createCategory(user.uid, name)
    setCategoryInput('')
  }

  const onEditCategory = async (category: WatchlistCategory) => {
    if (!user) return
    const newName = await promptDialog(t('watchlist.renamePrompt'), { defaultValue: category.name })
    if (newName) {
      await updateCategory(user.uid, category.id, newName)
    }
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
    setForm({ title: item.title, year: item.year, studio: item.studio, status: item.status })
    setEditingItemId(item.id)
    setIsItemFormOpen(true)
  }

  const onDeleteItem = async (itemId: string) => {
    if (!user || !activeCategoryId) return
    if (await confirmDialog(t('watchlist.confirmDeleteItem'))) {
      await deleteItem(user.uid, activeCategoryId, itemId)
    }
  }

  const filteredItems = useMemo(
    () => (statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  )

  const statusOptions = STATUSES.map((status) => ({ value: status, label: t(`watchlist.status.${status}`) }))

  return (
    <div>
      <PageHeader title={t('watchlist.heading')} subtitle={t('watchlist.subtitle')} />

      <form onSubmit={onCategorySubmit} className="mb-4 flex gap-3">
        <Field
          containerClassName="flex-grow"
          placeholder={t('watchlist.newCategoryPlaceholder')}
          value={categoryInput}
          onChange={(event) => setCategoryInput(event.target.value)}
          required
        />
        <Button type="submit">{t('watchlist.addCategoryButton')}</Button>
      </form>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('watchlist.emptyCategories')}</p>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
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
              <IconButton variant="edit" onClick={() => onEditCategory(category)} aria-label={t('common.edit')}>
                <EditIcon className="size-3.5" />
              </IconButton>
              <IconButton variant="delete" onClick={() => onDeleteCategory(category.id)} aria-label={t('common.delete')} className="mr-1">
                <DeleteIcon className="size-3.5" />
              </IconButton>
            </span>
          ))}
        </div>
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
            <Field
              label={t('watchlist.studioLabel')}
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
                {status === 'all' ? t('watchlist.statusFilterAll') : t(`watchlist.status.${status}`)}
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
                    {[t('watchlist.tableTitle'), t('watchlist.tableYear'), t('watchlist.tableStudio'), t('watchlist.tableStatus'), t('watchlist.tableWatched'), ''].map((label, index) => (
                      <th key={index} className="border-b border-(--color-border) p-3 text-left text-xs font-semibold uppercase tracking-wide text-(--color-ink-40)">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment)">{item.title}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.year || '—'}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.studio || '—'}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{t(`watchlist.status.${item.status}`)}</td>
                      <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!item.watchedAt}
                            onChange={(event) => markWatched(user!.uid, activeCategoryId, item.id, event.target.checked)}
                          />
                          {item.watchedAt ? `${t('watchlist.watchedPrefix')}: ${formatWatchedAt(item.watchedAt)}` : t('watchlist.markWatched')}
                        </label>
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
