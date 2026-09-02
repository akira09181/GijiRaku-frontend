import http from 'node:http';

const port = 8100;

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
  response.setHeader('content-type', 'application/json; charset=utf-8');

  if (url.pathname === '/api/pro/trends') {
    const from = url.searchParams.get('from_date') ?? '2026-09-01';
    const to = url.searchParams.get('to_date') ?? '2026-09-30';
    if (from === '2026-06-01') {
      response.end(JSON.stringify({ status: 'success', data: null }));
      return;
    }
    const empty = from === '2026-07-01';
    response.end(JSON.stringify({
      status: 'success',
      data: {
        period: { from, to },
        updated_at: '2026-09-02T09:00:00+09:00',
        totals: empty
          ? { assembly_count: 0, issue_count: 0, speaker_count: 0 }
          : { assembly_count: 2, issue_count: 3, speaker_count: 7 },
        keywords: empty ? [] : [
          { label: '防災', issue_count: 2, assembly_count: 2 },
          { label: '教育', issue_count: 1, assembly_count: 1 },
        ],
        themes: empty ? [] : [{ label: '防災・安全', issue_count: 2 }],
        assemblies: empty ? [] : [
          { assembly_id: 'city-a', assembly_name: 'A市議会', issue_count: 2, speaker_count: 4, top_theme: '防災・安全', themes: [] },
          { assembly_id: 'city-b', assembly_name: 'B市議会', issue_count: 1, speaker_count: 3, top_theme: '子育て・教育', themes: [] },
        ],
      },
    }));
    return;
  }

  if (url.pathname === '/api/pro/leads' && request.method === 'POST') {
    response.statusCode = 201;
    response.end(JSON.stringify({ status: 'success', lead_id: 'lead-test' }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ detail: 'Not found' }));
});

server.listen(port, '127.0.0.1');

function shutdown() {
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
