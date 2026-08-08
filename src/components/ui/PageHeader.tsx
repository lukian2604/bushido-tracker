export const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold text-(--color-parchment)">{title}</h1>
      <p className="mt-1.5 text-(--color-parchment-muted)">{subtitle}</p>
    </div>
  )
}
