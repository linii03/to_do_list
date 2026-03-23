const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low', none: '' };

let tasks = [];
let filter = 'all';
let nextId = 1;
let editingId = null;

// --- Persistence ---

function saveTasks() {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('nextId', String(nextId));
  } catch (e) {
    console.warn('localStorage unavailable — tasks will not persist between sessions.', e);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      tasks = JSON.parse(saved);
      nextId = parseInt(localStorage.getItem('nextId') || String(nextId), 10);
    }
  } catch (e) {
    console.warn('Could not load tasks from localStorage.', e);
  }
}

// --- Actions ---

function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  render();
}

function addTask() {
  const input = document.getElementById('task-input');
  const priority = document.getElementById('priority-select').value;
  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({ id: nextId++, text, done: false, priority });
  input.value = '';
  document.getElementById('priority-select').value = 'none';
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function startEdit(id) {
  editingId = id;
  render();
  const input = document.getElementById('edit-' + id);
  if (input) { input.focus(); input.select(); }
}

function finishEdit(id) {
  const input = document.getElementById('edit-' + id);
  if (!input) return;
  const task = tasks.find(t => t.id === id);
  if (task && input.value.trim()) task.text = input.value.trim();
  editingId = null;
  saveTasks();
  render();
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
}

// --- Rendering ---

function buildPriorityBadge(priority) {
  if (!priority || priority === 'none') return '';
  return `<span class="task-priority priority-${priority}">${priorityLabels[priority]}</span>`;
}

function buildTaskText(task) {
  if (editingId === task.id) {
    return `
      <input
        class="task-edit-input"
        id="edit-${task.id}"
        value="${task.text.replace(/"/g, '&quot;')}"
        onblur="finishEdit(${task.id})"
        onkeydown="
          if (event.key === 'Enter') finishEdit(${task.id});
          if (event.key === 'Escape') { editingId = null; render(); }
        "
      />`;
  }
  return `<span class="task-text" ondblclick="startEdit(${task.id})" title="Double-click to edit">${task.text}</span>`;
}

function buildTaskItem(task) {
  return `
    <div class="task-item ${task.done ? 'done' : ''}">
      <div class="task-check ${task.done ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
      ${buildTaskText(task)}
      ${buildPriorityBadge(task.priority)}
      <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete">&times;</button>
    </div>`;
}

function render() {
  let visible = tasks;
  if (filter === 'active') visible = tasks.filter(t => !t.done);
  else if (filter === 'done') visible = tasks.filter(t => t.done);
  else if (filter === 'high') visible = tasks.filter(t => t.priority === 'high');

  const remaining = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;

  document.getElementById('count').textContent = `${remaining} remaining`;
  document.getElementById('footer-count').textContent = `${tasks.length} total · ${done} done`;

  const list = document.getElementById('task-list');
  if (visible.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks here yet</div>';
    return;
  }

  list.innerHTML = visible.map(buildTaskItem).join('');
}

// --- Init ---

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

loadTasks();
render();