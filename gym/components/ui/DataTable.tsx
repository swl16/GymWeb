import type { ReactNode } from 'react';
/** TABLE UI: horizontal overflow on mobile; cells accept accessible React content. */
export function table(
  headers: string[],
  rows: ReactNode[][],
  empty = 'Nothing here yet.',
) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length}>
                <div className="empty">{empty}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
