import type { ReactNode } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout/legacy'
import type { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import type { DashboardWidgetId, DashboardWidgetLayout } from '@/lib/types'
import { WIDGET_MIN_SIZE, WIDGET_MAX_SIZE, WIDGET_RESIZE_HANDLES } from '@/lib/dashboard-widgets'

const GridLayout = WidthProvider(RGL)

interface DashboardGridProps {
  layout: DashboardWidgetLayout[]
  editable: boolean
  onLayoutChange: (layout: DashboardWidgetLayout[]) => void
  children: ReactNode
}

export const DashboardGrid = ({ layout, editable, onLayoutChange, children }: DashboardGridProps) => {
  const rglLayout: Layout = layout.map((entry) => ({
    i: entry.id,
    x: entry.x,
    y: entry.y,
    w: entry.w,
    h: entry.h,
    ...WIDGET_MIN_SIZE[entry.id],
    ...WIDGET_MAX_SIZE[entry.id],
    resizeHandles: WIDGET_RESIZE_HANDLES[entry.id],
  }))

  return (
    <GridLayout
      className="layout"
      layout={rglLayout}
      cols={12}
      rowHeight={70}
      margin={[14, 14]}
      isDraggable={editable}
      isResizable={editable}
      draggableHandle=".widget-drag-handle"
      compactType="vertical"
      onLayoutChange={(next) => {
        onLayoutChange(
          next.map((item) => ({ id: item.i as DashboardWidgetId, x: item.x, y: item.y, w: item.w, h: item.h })),
        )
      }}
    >
      {children}
    </GridLayout>
  )
}
