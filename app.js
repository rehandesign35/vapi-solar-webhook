const metricNodes = document.querySelectorAll('[data-metric]');
const outcomesNode = document.querySelector('#outcomes');
const objectionsNode = document.querySelector('#objections');
const pipelineNode = document.querySelector('#pipeline');
const errorNode = document.querySelector('#error-state');
const errorCopy = document.querySelector('#error-copy');
const generatedAtNode = document.querySelector('#generated-at');
const refreshButtons = [document.querySelector('#refresh-button'), document.querySelector('#retry-button')];

document.querySelector('#today').textContent = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: '2-digit', year: 'numeric'
}).format(new Date());

const titleCase = (value) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;
const duration = (seconds) => seconds == null ? '—' : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

function sortedEntries(values) {
  return Object.entries(values || {}).sort(([, first], [, second]) => second - first);
}

function renderRows(entries, target, emptyText) {
  if (!entries.length) {
    target.innerHTML = `<p class="empty-copy">${emptyText}</p>`;
    return;
  }
  const maximum = Math.max(...entries.map(([, count]) => count), 1);
  const rowClass = target === objectionsNode ? 'objection-row' : 'outcome-row';
  const nameClass = target === objectionsNode ? 'objection-name' : 'outcome-name';
  target.innerHTML = entries.slice(0, 5).map(([name, count]) => `
    <div class="${rowClass}">
      <span class="${nameClass}" title="${titleCase(name)}">${titleCase(name)}</span>
      <span class="row-track"><span class="row-fill" style="display:block;width:${Math.max((count / maximum) * 100, 4)}%"></span></span>
      <span class="row-count">${count}</span>
    </div>`).join('');
}

function renderPipeline(data) {
  const total = Number(data.total_calls) || 0;
  const qualified = Math.round((Number(data.qualified_rate) || 0) * total);
  const booked = Math.round((Number(data.booking_rate) || 0) * total);
  const steps = [['All calls', total], ['Qualified', qualified], ['Booked', booked]];
  pipelineNode.innerHTML = steps.map(([label, count]) => `
    <div class="pipeline-step">
      <span class="pipeline-label">${label}</span>
      <span class="pipeline-track"><span class="pipeline-fill" style="display:block;width:${total ? Math.max((count / total) * 100, 2) : 0}%"></span></span>
      <span class="pipeline-number">${count}</span>
    </div>`).join('');
}

function renderDashboard(data) {
  const values = {
    total_calls: data.total_calls ?? 0,
    qualified_rate: percent(data.qualified_rate),
    booking_rate: percent(data.booking_rate),
    avg_duration_seconds: duration(data.avg_duration_seconds)
  };
  metricNodes.forEach((node) => { node.textContent = values[node.dataset.metric]; });
  renderPipeline(data);
  renderRows(sortedEntries(data.outcome_breakdown), outcomesNode, 'No outcomes recorded yet.');
  renderRows(sortedEntries(data.objection_breakdown), objectionsNode, 'No objections recorded yet.');
  generatedAtNode.textContent = data.generated_at ? `updated ${new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'live data';
  document.querySelector('#insight-title').innerHTML = data.total_calls ? 'Keep the<br />signal clear.' : 'Ready when your<br />calls are.';
  document.querySelector('#insight-copy').textContent = data.total_calls ? 'Use the friction signals to tune the next conversation before it starts.' : 'Your next conversation is an opportunity to make the grid a little brighter.';
  errorNode.hidden = true;
}

async function loadDashboard() {
  refreshButtons.forEach((button) => { if (button) button.disabled = true; });
  try {
    const response = await fetch('/api/dashboard-metrics', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Metrics request failed (${response.status})`);
    renderDashboard(await response.json());
  } catch (error) {
    errorCopy.textContent = error.message.includes('Failed to fetch') ? 'The dashboard could not reach the metrics endpoint.' : error.message;
    errorNode.hidden = false;
  } finally {
    refreshButtons.forEach((button) => { if (button) button.disabled = false; });
  }
}

refreshButtons.forEach((button) => button?.addEventListener('click', loadDashboard));
loadDashboard();