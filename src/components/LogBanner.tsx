//

export type LogEntry = {
  id: string
  platform: 'basalam' | 'mixin'
  productId?: number
  title: string
  status: string
  message: string
  url?: string
  ts: number
}

type Props = {
  logs: LogEntry[]
  onOpenLink?: (entry: LogEntry) => void
}

export default function LogBanner({ logs, onOpenLink }: Props) {
  if (!logs || logs.length === 0) return null
  return (
    <div className="mt-4 bg-white/80 backdrop-blur border border-amber-200 rounded-xl shadow p-3" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-amber-700">گزارش خطاها و اعلان‌ها</div>
        <div className="text-xs text-gray-500">آخرین ۱۰ مورد</div>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        {logs.slice(0, 10).map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 p-2 rounded-lg border border-amber-100 bg-amber-50/60">
            <div className="flex-1">
              <div className="text-[13px] text-gray-800">{log.message}</div>
              <div className="text-[12px] text-gray-500 mt-1">
                <span className="ml-2">عنوان: {log.title}</span>
                <span className="ml-2">وضعیت: {log.status}</span>
                <span className="">زمان: {new Date(log.ts).toLocaleTimeString()}</span>
              </div>
            </div>
            {onOpenLink && (
              <button
                onClick={() => onOpenLink(log)}
                className="shrink-0 px-3 py-1 text-[12px] rounded-md bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                مشاهده در {log.platform === 'basalam' ? 'باسلام' : 'میکسین'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


