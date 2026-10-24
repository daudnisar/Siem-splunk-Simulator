import { LogEvent, SplSearchResult, SplFieldDistribution } from '../types/siem';

export function executeSPL(
  rawQuery: string,
  events: LogEvent[],
  timeRange: 'all' | '15m' | '1h' | '24h' | 'custom' = 'all'
): SplSearchResult {
  const startTime = performance.now();
  const query = (rawQuery || '').trim();

  // 1. Time range filtering
  const now = Date.now();
  let timeFiltered = [...events];
  if (timeRange === '15m') {
    timeFiltered = timeFiltered.filter(e => now - new Date(e._time).getTime() <= 15 * 60 * 1000);
  } else if (timeRange === '1h') {
    timeFiltered = timeFiltered.filter(e => now - new Date(e._time).getTime() <= 60 * 60 * 1000);
  } else if (timeRange === '24h') {
    timeFiltered = timeFiltered.filter(e => now - new Date(e._time).getTime() <= 24 * 60 * 60 * 1000);
  }

  // If query is empty or "*", return all events within time window
  if (!query || query === '*') {
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      rawEvents: timeFiltered,
      isStatsView: false,
      executionTimeMs: elapsed,
      eventCount: events.length,
      matchedCount: timeFiltered.length,
      timeBuckets: generateTimeBuckets(timeFiltered)
    };
  }

  // 2. Split pipe commands: "search term | stats count by user | sort -count"
  const pipeParts = query.split('|').map(s => s.trim());
  const initialSearch = pipeParts[0];
  const commandParts = pipeParts.slice(1);

  // 3. Filter initial events using initialSearch
  let matched = timeFiltered.filter(event => matchSearchFilter(initialSearch, event));

  // If no pipe commands, return raw events
  if (commandParts.length === 0) {
    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      rawEvents: matched,
      isStatsView: false,
      executionTimeMs: elapsed,
      eventCount: events.length,
      matchedCount: matched.length,
      timeBuckets: generateTimeBuckets(matched)
    };
  }

  // 4. Process pipe commands sequentially
  let currentRows: Record<string, string | number>[] = [];
  let isStats = false;
  let headers: string[] = [];

  for (const cmd of commandParts) {
    const lowerCmd = cmd.toLowerCase();

    // Command: | table col1, col2, col3
    if (lowerCmd.startsWith('table ')) {
      isStats = true;
      const cols = cmd.replace(/^table\s+/i, '').split(',').map(c => c.trim()).filter(Boolean);
      headers = cols;
      if (currentRows.length === 0) {
        currentRows = matched.map(ev => {
          const row: Record<string, string | number> = {};
          cols.forEach(col => {
            row[col] = getFieldValue(ev, col);
          });
          return row;
        });
      } else {
        currentRows = currentRows.map(row => {
          const newRow: Record<string, string | number> = {};
          cols.forEach(c => {
            newRow[c] = row[c] !== undefined ? row[c] : '-';
          });
          return newRow;
        });
      }
    }

    // Command: | stats count, count by field1, field2 OR | stats count by field
    else if (lowerCmd.startsWith('stats ')) {
      isStats = true;
      const statsSpec = cmd.replace(/^stats\s+/i, '').trim();
      const byMatch = statsSpec.match(/(.*?)\s+by\s+(.*)/i);
      
      let byFields: string[] = [];
      let metrics = statsSpec;
      if (byMatch) {
        metrics = byMatch[1].trim();
        byFields = byMatch[2].split(',').map(f => f.trim()).filter(Boolean);
      }

      // Group events
      const groups = new Map<string, LogEvent[]>();
      matched.forEach(ev => {
        const key = byFields.map(f => String(getFieldValue(ev, f))).join(':::');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(ev);
      });

      headers = [...byFields, 'count'];
      currentRows = [];

      groups.forEach((groupEvents, key) => {
        const row: Record<string, string | number> = {};
        const keyParts = key.split(':::');
        byFields.forEach((field, idx) => {
          row[field] = keyParts[idx];
        });
        row['count'] = groupEvents.length;

        // check if distinct count requested e.g. dc(src_ip)
        if (/dc\((.*?)\)/i.test(metrics)) {
          const dcField = metrics.match(/dc\((.*?)\)/i)?.[1].trim();
          if (dcField) {
            const dcValues = new Set(groupEvents.map(e => String(getFieldValue(e, dcField))));
            const dcHeader = `dc(${dcField})`;
            if (!headers.includes(dcHeader)) headers.push(dcHeader);
            row[dcHeader] = dcValues.size;
          }
        }

        currentRows.push(row);
      });
    }

    // Command: | top limit=N field OR | top field
    else if (lowerCmd.startsWith('top ')) {
      isStats = true;
      const topSpec = cmd.replace(/^top\s+/i, '').trim();
      let limit = 10;
      let field = topSpec;
      const limitMatch = topSpec.match(/limit=(\d+)\s+(.*)/i);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
        field = limitMatch[2].trim();
      }

      const counts: Record<string, number> = {};
      matched.forEach(ev => {
        const val = String(getFieldValue(ev, field) || '(unknown)');
        counts[val] = (counts[val] || 0) + 1;
      });

      headers = [field, 'count', 'percent'];
      const total = matched.length || 1;
      currentRows = Object.entries(counts)
        .map(([val, count]) => ({
          [field]: val,
          count,
          percent: `${((count / total) * 100).toFixed(1)}%`
        }))
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, limit);
    }

    // Command: | rare limit=N field
    else if (lowerCmd.startsWith('rare ')) {
      isStats = true;
      const rareSpec = cmd.replace(/^rare\s+/i, '').trim();
      const counts: Record<string, number> = {};
      matched.forEach(ev => {
        const val = String(getFieldValue(ev, rareSpec) || '(unknown)');
        counts[val] = (counts[val] || 0) + 1;
      });
      headers = [rareSpec, 'count'];
      currentRows = Object.entries(counts)
        .map(([val, count]) => ({ [rareSpec]: val, count }))
        .sort((a, b) => (a.count as number) - (b.count as number))
        .slice(0, 10);
    }

    // Command: | sort -field or | sort +field or | sort field
    else if (lowerCmd.startsWith('sort ')) {
      const sortSpec = cmd.replace(/^sort\s+/i, '').trim();
      const isDesc = sortSpec.startsWith('-');
      const cleanField = sortSpec.replace(/^[+-]/, '').trim();

      if (isStats && currentRows.length > 0) {
        currentRows.sort((a, b) => {
          const valA = a[cleanField] ?? '';
          const valB = b[cleanField] ?? '';
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
      } else {
        matched.sort((a, b) => {
          const valA = getFieldValue(a, cleanField);
          const valB = getFieldValue(b, cleanField);
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
      }
    }

    // Command: | head N
    else if (lowerCmd.startsWith('head ')) {
      const n = parseInt(cmd.replace(/^head\s+/i, '').trim(), 10) || 10;
      if (isStats) {
        currentRows = currentRows.slice(0, n);
      } else {
        matched = matched.slice(0, n);
      }
    }

    // Command: | dedup field
    else if (lowerCmd.startsWith('dedup ')) {
      const field = cmd.replace(/^dedup\s+/i, '').trim();
      const seen = new Set<string>();
      if (isStats) {
        currentRows = currentRows.filter(row => {
          const val = String(row[field]);
          if (seen.has(val)) return false;
          seen.add(val);
          return true;
        });
      } else {
        matched = matched.filter(ev => {
          const val = String(getFieldValue(ev, field));
          if (seen.has(val)) return false;
          seen.add(val);
          return true;
        });
      }
    }

    // Command: | where field op val (e.g. where count > 3)
    else if (lowerCmd.startsWith('where ')) {
      const whereSpec = cmd.replace(/^where\s+/i, '').trim();
      const whereMatch = whereSpec.match(/^([a-zA-Z0-9_]+)\s*(==|=|!=|>|>=|<|<=)\s*(.*)$/);
      if (whereMatch && isStats) {
        const [, f, op, rawVal] = whereMatch;
        const targetVal = isNaN(Number(rawVal)) ? rawVal.replace(/['"]/g, '') : Number(rawVal);
        currentRows = currentRows.filter(row => {
          const rowVal = row[f];
          if (rowVal === undefined) return false;
          if (op === '=' || op === '==') return String(rowVal).toLowerCase() === String(targetVal).toLowerCase();
          if (op === '!=') return String(rowVal).toLowerCase() !== String(targetVal).toLowerCase();
          if (typeof rowVal === 'number' && typeof targetVal === 'number') {
            if (op === '>') return rowVal > targetVal;
            if (op === '>=') return rowVal >= targetVal;
            if (op === '<') return rowVal < targetVal;
            if (op === '<=') return rowVal <= targetVal;
          }
          return true;
        });
      }
    }
  }

  const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
  return {
    rawEvents: matched,
    isStatsView: isStats,
    statsHeaders: headers,
    statsRows: currentRows,
    executionTimeMs: elapsed,
    eventCount: events.length,
    matchedCount: isStats ? currentRows.length : matched.length,
    timeBuckets: generateTimeBuckets(matched)
  };
}

// Helper: Extracts property or CIM field from LogEvent
export function getFieldValue(event: LogEvent, field: string): string | number {
  const normField = field.trim().toLowerCase();
  if (normField === '_time') return event._time;
  if (normField === '_raw') return event._raw;
  if (normField === 'index') return event.index;
  if (normField === 'sourcetype') return event.sourcetype;
  if (normField === 'host') return event.host;
  if (normField === 'source') return event.source;
  if (normField === 'src_ip' || normField === 'src') return event.src_ip || '-';
  if (normField === 'dest_ip' || normField === 'dest') return event.dest_ip || '-';
  if (normField === 'src_port') return event.src_port || '-';
  if (normField === 'dest_port') return event.dest_port || '-';
  if (normField === 'user') return event.user || '-';
  if (normField === 'action') return event.action || '-';
  if (normField === 'status') return event.status !== undefined ? event.status : '-';
  if (normField === 'event_id' || normField === 'eventcode') return event.event_id || '-';
  if (normField === 'signature') return event.signature || '-';
  if (normField === 'process_name' || normField === 'process') return event.process_name || '-';
  if (normField === 'command_line' || normField === 'cmd') return event.command_line || '-';
  if (normField === 'severity') return event.severity;
  if (normField === 'uri_path') return event.uri_path || '-';
  if (normField === 'uri_query') return event.uri_query || '-';
  if (normField === 'user_agent') return event.user_agent || '-';
  if (normField === 'mitre_technique_id') return event.mitre_technique_id || '-';
  if (normField === 'mitre_tactic') return event.mitre_tactic || '-';
  return (event as unknown as Record<string, string | number>)[normField] || '-';
}

// Matches SPL search filter terms: e.g. index=web status>=400 user="admin" "failed password"
function matchSearchFilter(filterStr: string, event: LogEvent): boolean {
  const trimmed = filterStr.trim();
  if (!trimmed || trimmed === '*') return true;

  // Support splitting by OR first
  if (/\s+OR\s+/i.test(trimmed)) {
    const orParts = trimmed.split(/\s+OR\s+/i);
    return orParts.some(part => matchSearchFilter(part, event));
  }

  // Tokenize by spaces while respecting quotes
  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  for (const token of tokens) {
    let cleanToken = token.trim();
    if (cleanToken.toUpperCase() === 'AND') continue;

    let isNot = false;
    if (cleanToken.toUpperCase().startsWith('NOT ')) {
      isNot = true;
      cleanToken = cleanToken.slice(4).trim();
    } else if (cleanToken.startsWith('!')) {
      isNot = true;
      cleanToken = cleanToken.slice(1).trim();
    }

    // Field comparison: field=val, field!=val, field>=val, field<=val, field>val, field<val
    const kvMatch = cleanToken.match(/^([a-zA-Z0-9_]+)\s*(=|!=|>=|<=|>|<)\s*(.*)$/);
    let matchedToken = false;

    if (kvMatch) {
      const field = kvMatch[1];
      const op = kvMatch[2];
      let val = kvMatch[3].replace(/^["']|["']$/g, '');

      const actualValue = getFieldValue(event, field);

      if (op === '=' || op === '==') {
        if (val.includes('*')) {
          // Wildcard match
          const reg = new RegExp('^' + val.replace(/\*/g, '.*') + '$', 'i');
          matchedToken = reg.test(String(actualValue));
        } else {
          matchedToken = String(actualValue).toLowerCase() === val.toLowerCase();
        }
      } else if (op === '!=') {
        matchedToken = String(actualValue).toLowerCase() !== val.toLowerCase();
      } else if (typeof actualValue === 'number' && !isNaN(Number(val))) {
        const numVal = Number(val);
        if (op === '>') matchedToken = actualValue > numVal;
        if (op === '>=') matchedToken = actualValue >= numVal;
        if (op === '<') matchedToken = actualValue < numVal;
        if (op === '<=') matchedToken = actualValue <= numVal;
      }
    } else {
      // Free-text match in _raw or signature
      const rawText = (event._raw + ' ' + (event.signature || '') + ' ' + (event.host || '')).toLowerCase();
      const searchNeedle = cleanToken.replace(/^["']|["']$/g, '').toLowerCase();
      matchedToken = rawText.includes(searchNeedle);
    }

    if (isNot ? matchedToken : !matchedToken) {
      return false;
    }
  }

  return true;
}

// Generate time histogram buckets for chart
function generateTimeBuckets(events: LogEvent[]): { time: string; count: number; attackCount: number }[] {
  if (events.length === 0) return [];

  // Group into 10 buckets
  const timestamps = events.map(e => new Date(e._time).getTime()).sort((a, b) => a - b);
  const min = timestamps[0];
  const max = Math.max(timestamps[timestamps.length - 1], min + 60000);
  const step = Math.max(Math.floor((max - min) / 10), 10000);

  const buckets: { time: string; count: number; attackCount: number }[] = [];
  for (let t = min; t <= max; t += step) {
    const bucketEnd = t + step;
    const inBucket = events.filter(e => {
      const time = new Date(e._time).getTime();
      return time >= t && time < bucketEnd;
    });

    const date = new Date(t);
    const label = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    buckets.push({
      time: label,
      count: inBucket.length,
      attackCount: inBucket.filter(e => e.is_attack).length
    });
  }

  return buckets;
}

// Calculate top field distributions for Splunk sidebar
export function calculateFieldDistributions(events: LogEvent[]): SplFieldDistribution[] {
  const fields = ['sourcetype', 'index', 'host', 'action', 'user', 'src_ip', 'dest_ip', 'status', 'event_id', 'severity'];
  const total = events.length || 1;

  return fields.map(field => {
    const counts: Record<string, number> = {};
    events.forEach(ev => {
      const val = String(getFieldValue(ev, field));
      if (val && val !== '-') {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    const topValues = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      field,
      totalEvents: events.length,
      topValues
    };
  });
}
