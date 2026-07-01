const DATA_URL = 'dashboard.json?cache=' + Date.now();

function pct(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, n));
}

function statusClass(status, priority) {
  const text = String(status || '').toLowerCase();
  if (text.includes('cancel')) return 'cancelled';
  if (priority || text.includes('priority')) return 'priority';
  if (text.includes('complete')) return 'complete';
  return 'progress';
}

function statusLabel(status) {
  const text = String(status || '').toLowerCase();
  if (text.includes('cancel')) return '🔴 Cancelled';
  if (text.includes('priority')) return '🔴 Priority';
  if (text.includes('complete')) return '✅ Complete';
  return '🟡 In Progress';
}

function renderServices(services = []) {
  if (!services.length) return '<div class="service-chip not-required">No services listed</div>';
  return services.map(s => {
    const cls = s.complete ? 'done' : '';
    const icon = s.complete ? '✅' : '⬜';
    return `<div class="service-chip ${cls}">${icon} ${s.name}</div>`;
  }).join('');
}

function renderAircraft(aircraft = []) {
  const board = document.getElementById('flightBoard');
  if (!aircraft.length) {
    board.innerHTML = '<div class="empty-state">No active aircraft loaded.</div>';
    return;
  }

  const sorted = [...aircraft].sort((a,b) => {
    const ap = a.priority ? 1 : 0;
    const bp = b.priority ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return statusClass(a.status).localeCompare(statusClass(b.status));
  });

  board.innerHTML = sorted.map(a => `
    <article class="aircraft-card ${statusClass(a.status, a.priority)}">
      <div class="aircraft-top">
        <div>
          <div class="tail">${a.tail || 'UNKNOWN'}</div>
          <div class="meta">${a.airline || ''}${a.airline && a.location ? ' • ' : ''}${a.location || ''}</div>
        </div>
        <div class="status">${statusLabel(a.status)}</div>
      </div>
      <div class="services-title">Services</div>
      <div class="service-list">${renderServices(a.services)}</div>
    </article>
  `).join('');
}

async function loadDashboard() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Could not load dashboard.json');
    const data = await response.json();

    const progress = pct(data.progressPercent);
    document.getElementById('connectionStatus').textContent = 'Live';
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = data.progressText || `${progress}% COMPLETE`;

    document.getElementById('aircraftRemaining').textContent = data.aircraftRemaining ?? '--';
    document.getElementById('priorityAircraft').textContent = data.priorityAircraft ?? '--';
    document.getElementById('employeesWorking').textContent = data.employeesWorking ?? '--';
    document.getElementById('servicesRemaining').textContent = data.servicesRemaining ?? '--';
    document.getElementById('lastUpdated').textContent = `Updated: ${data.lastUpdated || '--'}`;

    renderAircraft(data.aircraft || []);
  } catch (err) {
    document.getElementById('connectionStatus').textContent = 'Error';
    document.getElementById('flightBoard').innerHTML = '<div class="empty-state">Dashboard data could not load.</div>';
    console.error(err);
  }
}

loadDashboard();
setInterval(() => window.location.reload(), 60000);
