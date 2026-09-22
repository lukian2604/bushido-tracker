import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeToUser, setDashboardConfig, setDashboardLayout } from '@/services/user-service'
import { DEFAULT_DASHBOARD_CONFIG, DEFAULT_DASHBOARD_LAYOUT, mergeDashboardConfig, mergeDashboardLayout } from '@/lib/dashboard-widgets'
import type { DashboardWidgetConfig, DashboardWidgetLayout } from '@/lib/types'

export const useDashboardConfig = () => {
  const { user } = useAuth()
  const [config, setConfig] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_CONFIG)
  const [layout, setLayout] = useState<DashboardWidgetLayout[]>(DEFAULT_DASHBOARD_LAYOUT)

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, (userDoc) => {
      setConfig(mergeDashboardConfig(userDoc?.dashboardConfig))
      setLayout(mergeDashboardLayout(userDoc?.dashboardLayout))
    })
  }, [user])

  const updateConfig = (next: DashboardWidgetConfig[]) => {
    setConfig(next)
    if (user) setDashboardConfig(user.uid, next)
  }

  const updateLayout = (next: DashboardWidgetLayout[]) => {
    setLayout(next)
    if (user) setDashboardLayout(user.uid, next)
  }

  return { config, updateConfig, layout, updateLayout }
}
