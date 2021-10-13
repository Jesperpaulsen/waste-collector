import { createRef, FunctionalComponent } from 'preact'
import { memo } from 'preact/compat'
import { useContext, useEffect, useMemo } from 'preact/hooks'

import { UsageContext } from '../../contexts/Usage/UsageContext'
import { Dataset, Labels } from '../../types/chart-types'
import { getStartOfDateInUnix } from '../../utils/date'
import CustomChart from '../common/Charts/CustomChart'

const DashboardChart: FunctionalComponent = () => {
  const { usageState } = useContext(UsageContext)

  const labels = useMemo(() => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]
    const goBackDays = 7

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const daysSorted: Labels = []

    for (let i = 0; i < goBackDays; i++) {
      const newDate = new Date(tomorrow.setDate(tomorrow.getDate() - 1))
      const value = getStartOfDateInUnix(newDate)
      const label = i === 0 ? 'Today' : days[newDate.getDay()]
      daysSorted.push({ value, label })
    }

    return daysSorted.reverse()
  }, [])

  const allUsersUsage = useMemo(() => {
    const res: Dataset = { label: '', data: { 0: 0 } }
    const data: { [date: number]: number } = {}
    if (!usageState.allUsersUsageLastWeek) return res

    for (const [date, usage] of Object.entries(
      usageState.allUsersUsageLastWeek
    )) {
      data[date] = usage.CO2
    }

    res.label = 'Average use from all users'
    res.data = data
    return res
  }, [usageState.allUsersUsageLastWeek])

  const ownUsage = useMemo(() => {
    const res: Dataset = { label: '', data: { 0: 0 } }
    const data: { [date: number]: number } = {}
    if (!usageState.ownUsageLastWeek) return res

    for (const [date, usage] of Object.entries(usageState.ownUsageLastWeek)) {
      data[date] = usage.CO2
    }
    res.label = 'Your usage'
    res.data = data
    return res
  }, [usageState.ownUsageLastWeek])

  return useMemo(() => {
    return (
      <div className="h-164">
        <CustomChart
          type={'line'}
          labels={labels}
          datasets={[allUsersUsage, ownUsage]}
        />
      </div>
    )
  }, [labels, allUsersUsage, ownUsage])
}

export default DashboardChart
