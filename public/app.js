let token = "";

async function register() {
  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const text = await res.text();

    if (!res.ok) {
      alert("Ошибка регистрации: " + text);
      return;
    }

    alert("Регистрация успешна");
  } catch (err) {
    alert("Сервер недоступен");
  }
}

async function login() {
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Ошибка входа: " + (data.error || "неверные данные"));
      return;
    }

    if (!data.token) {
      alert("Сервер не вернул токен");
      return;
    }

    token = data.token;

    alert("Вход выполнен");

    loadTasks();
  } catch (err) {
    alert("Ошибка сервера");
  }
}

async function loadTasks() {
  if (!token) {
    alert("Сначала войди в систему");
    return;
  }

  try {
    const res = await fetch('/tasks', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Ошибка загрузки задач");
      return;
    }

    if (!Array.isArray(data)) {
      alert("Сервер вернул некорректные данные");
      return;
    }

    list.innerHTML = "";

    data.forEach(t => {
      const li = document.createElement('li');

      li.classList.add(t.priority);

      li.innerHTML = `
        ${t.text} (${t.priority})
        <button onclick="deleteTask('${t.id}')">X</button>
      `;

      list.appendChild(li);
    });

  } catch (err) {
    alert("Ошибка соединения с сервером");
  }
}

async function addTask() {
  if (!token) {
    alert("Сначала войди в систему");
    return;
  }

  try {
    await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        text: task.value,
        priority: priority.value
      })
    });

    task.value = "";

    loadTasks();
  } catch (err) {
    alert("Ошибка сервера");
  }
}

async function deleteTask(id) {
  if (!token) {
    alert("Сначала войди в систему");
    return;
  }

  try {
    await fetch(`/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    loadTasks();
  } catch (err) {
    alert("Ошибка сервера");
  }
}