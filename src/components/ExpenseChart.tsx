'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ChartData {
  name: string
  amount: number
  color: string
}

export function ExpenseChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) return null

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="amount"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => `€${Number(value).toFixed(2)}`}
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#f4f4f5' }}
            itemStyle={{ color: '#f4f4f5' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
