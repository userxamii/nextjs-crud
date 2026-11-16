'use client';

import {
  FormEvent,
  useEffect,
  useState
} from 'react';

type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

async function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  const response = await fetch('/api/tasks', {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to load tasks.');
  }

  return response.json();
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // LOAD TASKS
  async function loadTasks() {
    try {
      setTasks(await fetchTasks());

    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetchTasks(controller.signal)
      .then((tasks) => {
        if (!controller.signal.aborted) setTasks(tasks);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load tasks.');
        }
      });

    return () => controller.abort();
  }, []);

  // CREATE OR UPDATE TASK
  async function saveTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) return;

    setBusy(true);
    setError('');

    try {
      const editing = editingId !== null;

      const response = await fetch(
        editing
          ? `/api/tasks/${editingId}`
          : '/api/tasks',
        {
          method: editing ? 'PATCH' : 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            title: title.trim()
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error || 'Save failed.'
        );
      }

      setTitle('');
      setEditingId(null);

      await loadTasks();

    } catch (err) {
      setError((err as Error).message);

    } finally {
      setBusy(false);
    }
  }

  // EDIT MODE
  function startEdit(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
  }

  // CANCEL EDIT
  function cancelEdit() {
    setEditingId(null);
    setTitle('');
  }

  // TOGGLE COMPLETED STATUS
  async function toggleTask(task: Task) {
    setError('');

    try {
      const response = await fetch(
        `/api/tasks/${task.id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            completed: !task.completed
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Update failed.');
      }

      await loadTasks();

    } catch (err) {
      setError((err as Error).message);
    }
  }

  // DELETE TASK
  async function deleteTask(task: Task) {
    if (
      !window.confirm(
        `Delete "${task.title}"?`
      )
    ) {
      return;
    }

    setError('');

    try {
      const response = await fetch(
        `/api/tasks/${task.id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed.');
      }

      if (editingId === task.id) {
        cancelEdit();
      }

      await loadTasks();

    } catch (err) {
      setError((err as Error).message);
    }
  }

  // USER INTERFACE
  return (
    <main className="container">

      <div className="panel">

        <p className="eyebrow">
          NEXT.JS + SQLITE
        </p>

        <h1>Task Manager</h1>

        <p className="intro">
          Create, view, edit, complete, and delete tasks.
        </p>

        <form
          onSubmit={saveTask}
          className="taskForm"
        >

          <input
            aria-label="Task title"
            value={title}
            maxLength={120}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Enter a task title..."
            required
          />

          <button
            type="submit"
            disabled={busy}
          >
            {editingId === null
              ? 'Add Task'
              : 'Save Changes'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}

        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="summary">
          {tasks.length} total ·{' '}
          {
            tasks.filter(
              (task) => task.completed
            ).length
          } completed
        </div>

        <ul className="taskList">

          {tasks.map((task) => (

            <li
              key={task.id}
              className="task"
            >

              <label className="taskLabel">

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    void toggleTask(task)
                  }
                />

                <span
                  className={
                    task.completed ? 'done' : ''
                  }
                >
                  {task.title}
                </span>

              </label>

              <div className="actions">

                <button
                  className="secondary"
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    void deleteTask(task)
                  }
                >
                  Delete
                </button>

              </div>

            </li>

          ))}

          {tasks.length === 0 && (
            <li className="empty">
              No tasks yet. Add your first task above.
            </li>
          )}

        </ul>

      </div>

    </main>
  );
}
