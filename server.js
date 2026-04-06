async function loadTasks() {
  const res = await fetch('/tasks', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  // ❗ защита от ошибки сервера
  if (!res.ok) {
    alert(data.error || "Ошибка загрузки задач");
    return;
  }

  // ❗ защита от не-массива
  if (!Array.isArray(data)) {
    alert("Сервер вернул не список задач");
    return;
  }

  list.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement('li');

    li.classList.add(t.priority);

    li.innerHTML = `
      ${t.text} (${t.priority})
      <button onclick="deleteTask(${t.id})">X</button>
    `;

    list.appendChild(li);
  });
}