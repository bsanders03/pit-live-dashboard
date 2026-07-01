const DATA_URL = 'dashboard.json';
const REFRESH_MS = 30000;

function pctColor(percent) {
  if (percent >= 100) return '#00c853';
  if (percent >= 67) return '#00c853';
  if (percent >= 34) return '#facc15';
  return '#dc2626';
}

function normalizeStatus(status, priority) {
  const s = String(status || '').toLowerCase();
  if (s.includes('cancel')) return { cls: 'cancelled', label: '🔴 Cancelled' };
  if (s.includes('complete')) return { cls: 'complete', label: '✅ Complete' };
  if (priority || s.includes('priority')) return { cls: 'priority', label: '🔴 Priority' };
  return { cls: 'progress', label: '🟡 In Progress' };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderAircraft(aircraft = []) {
  const board = document.getElementById('flightBoard');
  const count = document.getElementById('aircraftCount');
  count.textContent = `${aircraft.length} aircraft`;

  if (!aircraft.length) {
    board.innerHTML = `<div class="empty-state">No active aircraft found.</div>`;
    return;
  }

  const sorted = [...aircraft].sort((a, b) => {
    const order = { priority: 0, progress: 1, complete: 2, cancelled: 3 };
    const as = normalizeStatus(a.status, a.priority).cls;
    const bs = normalizeStatus(b.status, b.priority).cls;
    return (order[as] ?? 9) - (order[bs] ?? 9);
  });

  board.innerHTML = sorted.map(plane => {
    const status = normalizeStatus(plane.status, plane.priority);
    const services = (plane.services || []).map(s => {
      const cls = s.complete ? 'service done' : 'service';
      return `<span class="${cls}">${s.name}</span>`;
    }).join('');

    return `
      <article class="aircraft-card ${status.cls}">
        <div class="aircraft-top">
          <div>
            <div class="tail">${plane.tail || 'Unknown'}</div>
            <div class="meta">${plane.airline || '--'} • ${plane.location || '--'}</div>
          </div>
          <div class="aircraft-status ${status.cls}">${status.label}</div>
        </div>
        <div class="services">${services || '<span class="service done">COMPLETE</span>'}</div>
      </article>
    `;
  }).join('');
}

async function loadDashboard() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Data file not found');
    const data = await response.json();

    const percent = Math.max(0, Math.min(100, Number(data.progressPercent || 0)));
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressFill').style.background = pctColor(percent);

    setText('progressText', data.progressText || `${percent}% COMPLETE`);
    setText('aircraftRemaining', data.aircraftRemaining ?? '--');
    setText('priorityAircraft', data.priorityAircraft ?? '--');
    setText('employeesWorking', data.employeesWorking ?? '--');
    setText('servicesRemaining', data.servicesRemaining ?? '--');
    setText('lastUpdated', `Last Updated: ${data.lastUpdated || '--'}`);
    setText('connectionStatus', 'Live');

    renderAircraft(data.aircraft || []);
  } catch (err) {
    setText('connectionStatus', 'Offline');
    setText('progressText', 'Unable to load dashboard data');
    console.error(err);
  }
}

loadDashboard();
setInterval(loadDashboard, REFRESH_MS);
