const storageKey = "no-forget-tasks";
const completedList = document.querySelector("#completed-list");
const completedEmpty = document.querySelector("#completed-empty");
const completedCount = document.querySelector("#completed-count");
const template = document.querySelector("#completed-template");

let tasks = loadTasks();

renderCompletedTasks();

function loadTasks() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeTask) : [];
  } catch {
    return [];
  }
}

function renderCompletedTasks() {
  const completedTasks = tasks
    .filter((task) => task.archivedAt)
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  completedList.innerHTML = "";
  completedCount.textContent = `${completedTasks.length} 项`;
  completedEmpty.hidden = completedTasks.length > 0;

  completedTasks.forEach((task) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector("h3");
    const detail = card.querySelector("p");
    const completedAt = card.querySelector(".completed-at");
    const archivedAt = card.querySelector(".archived-at");
    const deadlineAt = card.querySelector(".deadline-at");

    title.textContent = task.title;
    detail.textContent = task.detail;
    card.classList.toggle("is-urgent-task", task.urgent);
    completedAt.dateTime = task.completedAt || "";
    completedAt.textContent = `完成：${formatDeadline(task.completedAt)}`;
    archivedAt.dateTime = task.archivedAt;
    archivedAt.textContent = `归档：${formatDeadline(task.archivedAt)}`;
    deadlineAt.dateTime = task.deadline;
    deadlineAt.textContent = `原截止：${formatDeadline(task.deadline)}`;

    completedList.append(card);
  });
}

function normalizeTask(task) {
  const now = new Date().toISOString();
  const progress = Number(task.progress) || 0;
  const completedAt = task.completedAt || (progress >= 100 ? task.updatedAt || now : null);

  return {
    id: task.id || createId(),
    title: task.title || "未命名事项",
    detail: task.detail || "",
    deadline: task.deadline || `${toDateInputValue(new Date())}T18:00`,
    progress,
    urgent: Boolean(task.urgent),
    updatedAt: task.updatedAt || completedAt || now,
    completedAt,
    archivedAt: task.archivedAt || null
  };
}

function formatDeadline(value) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
