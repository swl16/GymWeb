import { date } from '@/lib/domain/format';
/** WORKOUT CHART UI: SVG minutes by log date. */
export default function WorkoutChart({ logs }: { logs: any[] }) {
  const rows = logs.slice(-7),
    max = Math.max(60, ...rows.map((l) => l.duration));
  return (
    <div className="workout-chart">
      <div className="chart-y">
        {[max, Math.round((max * 2) / 3), Math.round(max / 3), 0].map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>
      <div className="chart-area">
        <div className="gridlines">
          <i />
          <i />
          <i />
          <i />
        </div>
        {rows.length ? (
          <svg
            viewBox="0 0 600 140"
            preserveAspectRatio="none"
            aria-label="Workout duration trend"
            role="img"
          >
            <defs>
              <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity=".2" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={
                'M ' +
                rows
                  .map(
                    (l, i) =>
                      `${rows.length === 1 ? 300 : 20 + i * (560 / (rows.length - 1))},${130 - (l.duration / max) * 110}`,
                  )
                  .join(' L ') +
                ' L 580,140 L 20,140 Z'
              }
              fill="url(#fill)"
            />
            <polyline
              points={rows
                .map(
                  (l, i) =>
                    `${rows.length === 1 ? 300 : 20 + i * (560 / (rows.length - 1))},${130 - (l.duration / max) * 110}`,
                )
                .join(' ')}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.8"
              vectorEffect="non-scaling-stroke"
            />
            {rows.map((l, i) => (
              <circle
                key={l.id}
                cx={rows.length === 1 ? 300 : 20 + i * (560 / (rows.length - 1))}
                cy={130 - (l.duration / max) * 110}
                r="4"
                fill="var(--accent)"
                stroke="var(--panel)"
                strokeWidth="3"
              >
                <title>
                  {l.log_date}: {l.duration} minutes
                </title>
              </circle>
            ))}
          </svg>
        ) : (
          <div className="empty">Log your first workout to see your rhythm.</div>
        )}
        <div className="chart-x">
          {rows.map((l) => (
            <span key={l.id}>{date(l.log_date, { day: 'numeric', month: 'short' })}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
