const storageKey = "no-forget-tasks";
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const newTaskSection = document.querySelector(".new-task");
const toggleTaskFormButton = document.querySelector("#toggle-task-form");
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const detailInput = document.querySelector("#task-detail");
const dateInput = document.querySelector("#task-date");
const timeInput = document.querySelector("#task-time");
const urgentInput = document.querySelector("#task-urgent");
const template = document.querySelector("#task-template");

let tasks = loadTasks();

archiveOldCompletedTasks();
saveTasks();
renderTasks();
setDefaultDeadline();

toggleTaskFormButton.addEventListener("click", () => {
  const isExpanding = form.hidden;

  form.hidden = !isExpanding;
  newTaskSection.classList.toggle("is-collapsed", !isExpanding);
  toggleTaskFormButton.textContent = isExpanding ? "收起" : "展开";
  toggleTaskFormButton.setAttribute("aria-expanded", String(isExpanding));

  if (isExpanding) {
    titleInput.focus();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const task = {
    id: createId(),
    title: titleInput.value.trim(),
    detail: detailInput.value.trim(),
    deadline: `${dateInput.value}T${timeInput.value}`,
    progress: 0,
    urgent: urgentInput.checked,
    updatedAt: new Date().toISOString(),
    completedAt: null,
    archivedAt: null
  };

  tasks = [task, ...tasks];
  saveTasks();
  renderTasks();
  form.reset();
  setDefaultDeadline();
  collapseTaskForm();
});

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

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = "";
  taskCount.textContent = `${visibleTasks.length} 项`;
  emptyState.hidden = visibleTasks.length > 0;

  visibleTasks.forEach((task) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector("h3");
    const detail = card.querySelector("p");
    const urgentCheckbox = card.querySelector(".urgent-input");
    const progressInput = card.querySelector(".progress-input");
    const progressValue = card.querySelector(".progress-value");
    const deadline = card.querySelector("time");
    const daysLeft = card.querySelector(".days-left");

    title.textContent = task.title;
    detail.textContent = task.detail;
    urgentCheckbox.checked = task.urgent;
    progressInput.value = task.progress;
    progressValue.textContent = `${task.progress}%`;
    deadline.dateTime = task.deadline;
    deadline.textContent = `截止：${formatDeadline(task.deadline)}`;
    card.classList.toggle("is-urgent-task", task.urgent);
    card.classList.toggle("is-completed-task", task.progress >= 100);
    updateDaysLeft(daysLeft, task);

    urgentCheckbox.addEventListener("change", () => {
      task.urgent = urgentCheckbox.checked;
      task.updatedAt = new Date().toISOString();
      archiveOldCompletedTasks();
      saveTasks();
      renderTasks();
    });

    progressInput.addEventListener("input", () => {
      progressValue.textContent = `${progressInput.value}%`;
    });

    progressInput.addEventListener("change", () => {
      const wasCompleted = task.progress >= 100;
      task.progress = Number(progressInput.value);
      task.updatedAt = new Date().toISOString();

      if (task.progress >= 100 && !wasCompleted) {
        task.completedAt = task.updatedAt;
      }

      if (task.progress < 100) {
        task.completedAt = null;
        task.archivedAt = null;
      }

      archiveOldCompletedTasks();
      saveTasks();
      renderTasks();
    });

    taskList.append(card);
  });
}

function getVisibleTasks() {
  return tasks
    .filter((task) => !task.archivedAt)
    .sort(compareTasks);
}

function compareTasks(a, b) {
  const aCompleted = a.progress >= 100;
  const bCompleted = b.progress >= 100;

  if (aCompleted !== bCompleted) {
    return aCompleted ? 1 : -1;
  }

  if (aCompleted && bCompleted) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }

  if (a.urgent !== b.urgent) {
    return a.urgent ? -1 : 1;
  }

  const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);

  if (deadlineDiff !== 0) {
    return deadlineDiff;
  }

  if (a.progress !== b.progress) {
    return b.progress - a.progress;
  }

  return new Date(b.updatedAt) - new Date(a.updatedAt);
}

function archiveOldCompletedTasks() {
  const now = Date.now();
  let changed = false;

  tasks.forEach((task) => {
    if (task.progress >= 100 && !task.archivedAt && now - new Date(task.updatedAt).getTime() > 86400000) {
      task.archivedAt = new Date(now).toISOString();
      changed = true;
    }
  });

  return changed;
}

function updateDaysLeft(element, task) {
  element.classList.remove("is-urgent", "is-done");

  if (task.progress >= 100) {
    element.textContent = "已完成";
    element.classList.add("is-done");
    return;
  }

  const deadline = new Date(task.deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadline - now) / 86400000);

  if (diffDays < 0) {
    element.textContent = `已逾期 ${Math.abs(diffDays)} 天`;
    element.classList.add("is-urgent");
  } else if (diffDays === 0) {
    element.textContent = "今天截止";
    element.classList.add("is-urgent");
  } else {
    element.textContent = `还剩 ${diffDays} 天`;

    if (diffDays <= 2) {
      element.classList.add("is-urgent");
    }
  }
}

function formatDeadline(value) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function setDefaultDeadline() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  dateInput.value = toDateInputValue(tomorrow);
  timeInput.value = "18:00";
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function collapseTaskForm() {
  form.hidden = true;
  newTaskSection.classList.add("is-collapsed");
  toggleTaskFormButton.textContent = "展开";
  toggleTaskFormButton.setAttribute("aria-expanded", "false");
}
