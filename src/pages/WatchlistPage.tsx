import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { IconButton } from '@/components/ui/IconButton'
import { MediaSearchBox } from '@/components/ui/MediaSearchBox'
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  CheckIcon,
  DownloadIcon,
  MediaVideoIcon,
  MediaBookIcon,
  MediaMangaIcon,
  MediaAudiobookIcon,
  MediaGameIcon,
} from '@/components/ui/icons'
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
  getAllCategoriesWithProgress,
  uploadItemCover,
} from '@/services/watchlist-service'
import { logActivityEvent } from '@/services/friend-service'
import { subscribeToUser } from '@/services/user-service'
import { detectCountry, languageForCountry } from '@/lib/countries'
import { exportCategoryToPdf } from '@/lib/export-pdf'
import type { MediaSearchResult, MediaType, UserDoc, WatchlistCategory, WatchlistItem, WatchlistStatus } from '@/lib/types'
import type { Timestamp } from 'firebase/firestore'

const STATUSES: WatchlistStatus[] = ['planToWatch', 'watching', 'completed', 'onHold', 'dropped']
const MEDIA_TYPES: MediaType[] = ['video', 'book', 'manga', 'audiobook', 'game']
const EMOJI_SUGGESTIONS = ['🔥', '⭐', '💎', '🌙', '🐉', '⚔️', '🎯', '🍿']

const MEDIA_ICONS: Record<MediaType, typeof MediaVideoIcon> = {
  video: MediaVideoIcon,
  book: MediaBookIcon,
  manga: MediaMangaIcon,
  audiobook: MediaAudiobookIcon,
  game: MediaGameIcon,
}

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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const EMPTY_FORM = { title: '', year: '', studio: '', author: '', status: 'planToWatch' as WatchlistStatus, coverUrl: '' }
const EMPTY_CATEGORY_DRAFT = { name: '', mediaType: 'video' as MediaType, emoji: '' }

export const WatchlistPage = () => {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const { confirmDialog } = useModal()

  const [categories, setCategories] = useState<WatchlistCategory[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [statusFilter, setStatusFilter] = useState<WatchlistStatus | 'all'>('all')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState(EMPTY_CATEGORY_DRAFT)
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; mediaType: MediaType; emoji: string } | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingWatchedAtId, setEditingWatchedAtId] = useState<string | null>(null)
  const [watchedAtInput, setWatchedAtInput] = useState('')
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState('')
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, setUserDoc)
  }, [user])

  const searchLanguage = languageForCountry(userDoc?.country || detectCountry())

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

  useEffect(() => {
    if (!user || categories.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale counts when the category list becomes empty
      setCategoryCounts({})
      return
    }
    getAllCategoriesWithProgress(user.uid)
      .then((withProgress) => setCategoryCounts(Object.fromEntries(withProgress.map((category) => [category.id, category.total]))))
      .catch(() => {})
  }, [user, categories])

  const displayCounts = { ...categoryCounts, ...(activeCategoryId ? { [activeCategoryId]: items.length } : {}) }

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

  const onOpenAddCategory = () => {
    setCategoryDraft(EMPTY_CATEGORY_DRAFT)
    setEditingCategory(null)
    setIsAddCategoryOpen(true)
  }

  const onCategorySubmit = async (event: FormEvent) => {
    event.preventDefault()
    const name = categoryDraft.name.trim()
    if (!user || !name) return
    await createCategory(user.uid, name, categoryDraft.mediaType, categoryDraft.emoji.trim())
    setCategoryDraft(EMPTY_CATEGORY_DRAFT)
    setIsAddCategoryOpen(false)
  }

  const onStartEditCategory = (category: WatchlistCategory) => {
    setIsAddCategoryOpen(false)
    setEditingCategory({ id: category.id, name: category.name, mediaType: category.mediaType || 'video', emoji: category.emoji || '' })
  }

  const onSaveEditCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !editingCategory) return
    const name = editingCategory.name.trim()
    if (!name) return
    await updateCategory(user.uid, editingCategory.id, { name, mediaType: editingCategory.mediaType, emoji: editingCategory.emoji.trim() })
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
    setForm({ title: item.title, year: item.year, studio: item.studio, author: item.author || '', status: item.status, coverUrl: item.coverUrl || '' })
    setEditingItemId(item.id)
    setIsItemFormOpen(true)
  }

  const onSelectSearchResult = (result: MediaSearchResult) => {
    setForm((current) => ({
      ...current,
      title: result.title || current.title,
      year: result.year || current.year,
      studio: result.studio || current.studio,
      author: result.author || current.author,
      coverUrl: result.coverUrl || current.coverUrl,
    }))
  }

  const onPickCover = () => coverInputRef.current?.click()

  const onCoverFileSelected = async (file: File | undefined) => {
    if (!file || !user) return
    setCoverError('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setCoverError(t('profile.photoErrorType'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError(t('profile.photoErrorSize'))
      return
    }

    setIsUploadingCover(true)
    try {
      const coverUrl = await uploadItemCover(user.uid, file)
      setForm((current) => ({ ...current, coverUrl }))
    } catch {
      setCoverError(t('profile.photoErrorGeneric'))
    } finally {
      setIsUploadingCover(false)
    }
  }

  const onDeleteItem = async (itemId: string, coverUrl?: string | null) => {
    if (!user || !activeCategoryId) return
    if (await confirmDialog(t('watchlist.confirmDeleteItem'))) {
      await deleteItem(user.uid, activeCategoryId, itemId, coverUrl)
    }
  }

  const onMarkWatched = (itemId: string, checked: boolean) => {
    if (!user || !activeCategoryId) return
    markWatched(user.uid, activeCategoryId, itemId, checked)
    if (checked) logActivityEvent(user.uid, 'watchlistCompleted')
  }

  const onExportPdf = async () => {
    if (!activeCategory || items.length === 0) return
    setIsExportingPdf(true)
    try {
      const generatedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
      await exportCategoryToPdf({
        categoryName: activeCategory.name,
        generatedAtText: `${t('watchlist.exportedAtPrefix')} ${generatedAt}`,
        items,
        hasAuthor,
        authorLabel: t('watchlist.authorLabel'),
        studioLabel,
        columnLabels: {
          title: t('watchlist.tableTitle'),
          year: t('watchlist.tableYear'),
          status: t('watchlist.tableStatus'),
          watched: t('watchlist.tableWatched'),
        },
        statusLabel: getStatusLabel,
        watchedLabel: (item) => (item.watchedAt ? formatWatchedAt(item.watchedAt) : t(`watchlist.markLabel.${mediaType}`)),
        locale,
      })
    } finally {
      setIsExportingPdf(false)
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
    MEDIA_TYPES.map((type) => {
      const TypeIcon = MEDIA_ICONS[type]
      return (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          style={selected === type ? { borderColor: `var(--color-type-${type})`, color: `var(--color-type-${type})` } : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            selected === type
              ? ''
              : 'border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-parchment-muted)'
          }`}
        >
          <TypeIcon className="size-3.5" />
          {t(`watchlist.mediaType.${type}`)}
        </button>
      )
    })

  const categoryForm = (
    <div className="mb-4 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-4">
      <h3 className="mb-3 font-accent text-sm font-semibold text-(--color-parchment)">
        {editingCategory ? t('watchlist.editCategoryTitle') : t('watchlist.addCollectionCard')}
      </h3>
      <form onSubmit={editingCategory ? onSaveEditCategory : onCategorySubmit}>
        <div className="mb-3 flex gap-3">
          <Field
            containerClassName="w-20 flex-none"
            maxLength={2}
            placeholder="🔥"
            value={editingCategory ? editingCategory.emoji : categoryDraft.emoji}
            onChange={(event) =>
              editingCategory
                ? setEditingCategory((curr) => (curr ? { ...curr, emoji: event.target.value } : null))
                : setCategoryDraft((curr) => ({ ...curr, emoji: event.target.value }))
            }
          />
          <Field
            containerClassName="flex-grow"
            placeholder={t('watchlist.newCategoryPlaceholder')}
            value={editingCategory ? editingCategory.name : categoryDraft.name}
            onChange={(event) =>
              editingCategory
                ? setEditingCategory((curr) => (curr ? { ...curr, name: event.target.value } : null))
                : setCategoryDraft((curr) => ({ ...curr, name: event.target.value }))
            }
            required
          />
        </div>
        <p className="mb-3 text-xs text-(--color-parchment-muted)">{t('watchlist.emojiHint')}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EMOJI_SUGGESTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                editingCategory
                  ? setEditingCategory((curr) => (curr ? { ...curr, emoji } : null))
                  : setCategoryDraft((curr) => ({ ...curr, emoji }))
              }
              className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) text-base hover:border-(--color-gold)"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {mediaTypePills(editingCategory ? editingCategory.mediaType : categoryDraft.mediaType, (type) =>
            editingCategory
              ? setEditingCategory((curr) => (curr ? { ...curr, mediaType: type } : null))
              : setCategoryDraft((curr) => ({ ...curr, mediaType: type })),
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (editingCategory ? setEditingCategory(null) : setIsAddCategoryOpen(false))}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </div>
  )

  return (
    <div>
      <PageHeader title={t('watchlist.heading')} subtitle={t('watchlist.subtitle')} />

      {categories.length === 0 && !isAddCategoryOpen ? (
        <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('watchlist.emptyCategories')}</p>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const type = category.mediaType || 'video'
            const TypeIcon = MEDIA_ICONS[type]
            const isActive = category.id === activeCategoryId
            const tc = `var(--color-type-${type})`
            return (
              <div
                key={category.id}
                data-active={isActive}
                style={{
                  borderColor: isActive ? tc : undefined,
                  backgroundColor: isActive ? `color-mix(in srgb, ${tc} 10%, var(--color-ink-10))` : undefined,
                }}
                className="group relative rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-4 text-left transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className="flex size-9 flex-none items-center justify-center rounded-xl"
                    style={{ backgroundColor: `color-mix(in srgb, ${tc} 20%, var(--color-ink-10))`, color: tc }}
                  >
                    {category.emoji ? <span className="text-base">{category.emoji}</span> : <TypeIcon className="size-4.5" />}
                  </button>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <IconButton variant="edit" onClick={() => onStartEditCategory(category)} aria-label={t('common.edit')}>
                      <EditIcon className="size-3.5" />
                    </IconButton>
                    <IconButton variant="delete" onClick={() => onDeleteCategory(category.id)} aria-label={t('common.delete')}>
                      <DeleteIcon className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
                <button type="button" onClick={() => selectCategory(category.id)} className="mt-3 block w-full text-left">
                  <p className="font-accent truncate text-base font-semibold text-(--color-parchment)">{category.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className="font-semibold uppercase tracking-wide" style={{ color: tc }}>
                      {t(`watchlist.mediaType.${type}`)}
                    </span>
                    <span className="size-0.5 rounded-full bg-(--color-ink-40)" />
                    <span className="text-(--color-parchment-muted)">{displayCounts[category.id] ?? 0}</span>
                  </p>
                </button>
              </div>
            )
          })}

          {!isAddCategoryOpen && (
            <button
              type="button"
              onClick={onOpenAddCategory}
              className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-(--color-border) p-4 text-sm text-(--color-parchment-muted) transition-colors hover:border-(--color-gold) hover:text-(--color-parchment)"
            >
              <span className="flex size-8 items-center justify-center rounded-full border border-(--color-border)">
                <PlusIcon className="size-3.5" />
              </span>
              {t('watchlist.addCollectionCard')}
            </button>
          )}
        </div>
      )}

      {(isAddCategoryOpen || editingCategory) && categoryForm}

      {activeCategoryId && (
        <Button onClick={onOpenAddItem} className="mb-6">
          <PlusIcon className="size-4" />
          {t('watchlist.addItemButton')}
        </Button>
      )}

      {activeCategoryId && isItemFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancelItemForm}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">
              {editingItemId ? t('watchlist.editItemTitle') : t('watchlist.addItemTitle')}
            </h2>

            <MediaSearchBox mediaType={mediaType} onSelect={onSelectSearchResult} searchLanguage={searchLanguage} />

            <form onSubmit={onItemSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 sm:col-span-2">
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="" className="h-16 w-12 flex-none rounded object-cover" />
                ) : (
                  <span className="flex h-16 w-12 flex-none items-center justify-center rounded bg-(--color-ink-20) text-[10px] text-(--color-ink-40)">
                    {t('watchlist.tableTitle')}
                  </span>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  className="hidden"
                  onChange={(event) => onCoverFileSelected(event.target.files?.[0])}
                />
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={onPickCover}
                    disabled={isUploadingCover}
                    className="text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-gold) disabled:opacity-50"
                  >
                    {isUploadingCover ? t('profile.photoUploading') : t('watchlist.uploadCoverButton')}
                  </button>
                  {form.coverUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, coverUrl: '' }))}
                      className="text-xs text-(--color-parchment-muted) hover:text-(--color-accent)"
                    >
                      {t('watchlist.removeCover')}
                    </button>
                  )}
                  {coverError && <p className="text-[11px] text-(--color-accent)">{coverError}</p>}
                </div>
              </div>
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
        </div>
      )}

      {activeCategoryId && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(['all', ...STATUSES] as const).map((status) => {
              const sc = status === 'all' ? 'var(--color-gold)' : `var(--color-status-${status})`
              const isActive = statusFilter === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  style={{
                    borderColor: isActive ? sc : undefined,
                    color: isActive ? sc : undefined,
                    backgroundColor: isActive ? `color-mix(in srgb, ${sc} 16%, var(--color-ink-10))` : undefined,
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm ${
                    isActive ? '' : 'border-(--color-border) text-(--color-parchment-muted)'
                  }`}
                >
                  {status !== 'all' && <span className="size-2 flex-none rounded-full" style={{ backgroundColor: sc }} />}
                  {status === 'all' ? t('watchlist.statusFilterAll') : getStatusLabel(status)}
                </button>
              )
              })}
            </div>

            <Button variant="ghost" onClick={onExportPdf} disabled={isExportingPdf || items.length === 0}>
              <DownloadIcon className="size-4" />
              {isExportingPdf ? t('watchlist.exportingPdf') : t('watchlist.exportPdfButton')}
            </Button>
          </div>

          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('watchlist.emptyItems')}</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
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
                      <tr key={item.id} className="hover:bg-(--color-parchment)/[0.03]">
                        <td className="border-b border-(--color-border) p-3 text-sm font-medium text-(--color-parchment)">
                          <div className="flex items-center gap-2.5">
                            {item.coverUrl && <img src={item.coverUrl} alt="" className="h-9 w-6.5 flex-none rounded object-cover" />}
                            {item.title}
                          </div>
                        </td>
                        <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted) tabular-nums">{item.year || '—'}</td>
                        {hasAuthor && (
                          <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.author || '—'}</td>
                        )}
                        <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">{item.studio || '—'}</td>
                        <td className="border-b border-(--color-border) p-3">
                          <StatusBadge status={item.status} label={getStatusLabel(item.status)} />
                        </td>
                        <td className="border-b border-(--color-border) p-3 text-sm text-(--color-parchment-muted)">
                          <div className="flex items-center gap-2.5">
                            <SeenCheck
                              checked={!!item.watchedAt}
                              onChange={(checked) => {
                                onMarkWatched(item.id, checked)
                                if (!checked) setEditingWatchedAtId(null)
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
                                  className="text-left text-xs text-(--color-parchment-muted) hover:text-(--color-parchment)"
                                >
                                  {completedVerb}: {formatWatchedAt(item.watchedAt)}
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-(--color-ink-40)">{t(`watchlist.markLabel.${mediaType}`)}</span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-(--color-border) p-3">
                          <div className="flex justify-end gap-1">
                            <IconButton variant="edit" onClick={() => onEditItem(item)} aria-label={t('common.edit')}>
                              <EditIcon className="size-4" />
                            </IconButton>
                            <IconButton variant="delete" onClick={() => onDeleteItem(item.id, item.coverUrl)} aria-label={t('common.delete')}>
                              <DeleteIcon className="size-4" />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2.5 sm:hidden">
                {filteredItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-(--color-border) bg-(--color-ink) p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 gap-2.5">
                        {item.coverUrl && <img src={item.coverUrl} alt="" className="h-12 w-9 flex-none rounded object-cover" />}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--color-parchment)">{item.title}</p>
                          <p className="mt-0.5 text-xs text-(--color-parchment-muted)">
                            {[item.year, hasAuthor ? item.author : item.studio].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-none gap-1">
                        <IconButton variant="edit" onClick={() => onEditItem(item)} aria-label={t('common.edit')}>
                          <EditIcon className="size-3.5" />
                        </IconButton>
                        <IconButton variant="delete" onClick={() => onDeleteItem(item.id, item.coverUrl)} aria-label={t('common.delete')}>
                          <DeleteIcon className="size-3.5" />
                        </IconButton>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge status={item.status} label={getStatusLabel(item.status)} />
                      <SeenCheck checked={!!item.watchedAt} onChange={(checked) => onMarkWatched(item.id, checked)} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const StatusBadge = ({ status, label }: { status: WatchlistStatus; label: string }) => {
  const sc = `var(--color-status-${status})`
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${sc} 16%, var(--color-ink-10))`, color: sc }}
    >
      <span className="size-1.5 flex-none rounded-full" style={{ backgroundColor: sc }} />
      {label}
    </span>
  )
}

const SeenCheck = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={checked ? { backgroundColor: 'var(--color-accent-green)', borderColor: 'var(--color-accent-green)' } : undefined}
    className="flex size-5 flex-none items-center justify-center rounded-md border border-(--color-border) text-(--color-ink) transition-colors"
  >
    {checked && <CheckIcon className="size-3" />}
  </button>
)
