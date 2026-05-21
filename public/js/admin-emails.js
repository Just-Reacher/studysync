/* ─────────────────────────────────────────────
   StudySync — admin-emails.js (Refactored)
   Handles email inbox, search, filters, pagination
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  let page = 1;
  let perPage = 20;
  let searchQ = '';
  let filterStatus = '';

  const tableBody   = document.getElementById('emailsTbody');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('filterStatus');
  const paginationEl = document.getElementById('pagination');
  const countEl     = document.getElementById('emailCount');
  const infoEl      = document.getElementById('tableInfo');
  const exportBtn   = document.getElementById('btnExport');

  /* ── Safety check: page not loaded properly ── */
  if (!tableBody) {
    console.warn('admin-emails.js loaded but emailsTbody not found on page.');
    return;
  }

  /* ── Load Emails ── */
  const loadEmails = async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: perPage,
        search: searchQ,
        status: filterStatus
      });

      const data = await adminApi(`/emails?${params}`);
      if (!data) return;

      const emails = data.emails || [];

      /* ── Stats ── */
      if (countEl) {
        countEl.textContent = `${data.total ?? emails.length} emails`;
      }

      if (infoEl) {
        infoEl.textContent = `${emails.length} shown`;
      }

      /* ── Empty state ── */
      if (!emails.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;padding:30px;color:var(--text-light);">
              No emails found.
            </td>
          </tr>`;
        return;
      }

      /* ── Render rows ── */
      tableBody.innerHTML = emails.map(email => `
        <tr>
          <td style="font-size:12px;color:var(--text-light);white-space:nowrap;">
            ${email.created_at ? new Date(email.created_at).toLocaleString() : '—'}
          </td>

          <td style="font-size:13px;">
            ${escapeHTML(email.name || 'Unknown')}
          </td>

          <td style="font-size:13px;color:var(--text-mid);">
            ${escapeHTML(email.email || '—')}
          </td>

          <td style="font-size:12px;">
            <span class="badge ${
              email.status === 'read'
                ? 'badge-active'
                : email.status === 'replied'
                ? 'badge-purple'
                : 'badge-amber'
            }">
              ${email.status || 'new'}
            </span>
          </td>

          <td style="font-size:12px;color:var(--text-light);max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHTML(email.message || '—')}
          </td>
        </tr>
      `).join('');

      /* ── Pagination ── */
      const pages = Math.ceil((data.total || emails.length) / perPage);

      if (paginationEl) {
        paginationEl.innerHTML = Array.from(
          { length: Math.min(pages, 7) },
          (_, i) => i + 1
        ).map(p => `
          <button class="page-btn ${p === page ? 'active' : ''}" data-p="${p}">
            ${p}
          </button>
        `).join('');

        paginationEl.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            page = parseInt(btn.dataset.p);
            loadEmails();
          });
        });
      }

    } catch (err) {
      showToast?.(err.message || 'Failed to load emails', 'error');
    }
  };

  /* ── Search ── */
  searchInput?.addEventListener('input', e => {
    searchQ = e.target.value;
    page = 1;
    loadEmails();
  });

  /* ── Filter ── */
  statusFilter?.addEventListener('change', e => {
    filterStatus = e.target.value;
    page = 1;
    loadEmails();
  });

  /* ── Export CSV ── */
  exportBtn?.addEventListener('click', async () => {
    try {
      const data = await adminApi(`/emails/export?status=${filterStatus}&search=${searchQ}`);
      if (!data) return;

      const rows = [
        ['Date', 'Name', 'Email', 'Status', 'Message']
      ];

      (data.emails || []).forEach(e => {
        rows.push([
          e.created_at,
          e.name,
          e.email,
          e.status,
          e.message
        ]);
      });

      const csv = rows
        .map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `studysync-emails-${Date.now()}.csv`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      showToast?.(err.message || 'Export failed', 'error');
    }
  });

  /* ── Helpers ── */
  const escapeHTML = str => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /* ── Init ── */
  loadEmails();
});