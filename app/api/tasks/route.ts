import { connection, NextResponse } from 'next/server';
import db from '@/lib/db';

type TaskRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

function serialize(task: TaskRow) {
  return {
    ...task,
    completed: Boolean(task.completed),
  };
}

// READ ALL TASKS
export async function GET() {
  await connection();

  const tasks = db.prepare(
    'SELECT * FROM tasks ORDER BY id DESC'
  ).all() as TaskRow[];

  return NextResponse.json(tasks.map(serialize));
}

// CREATE TASK
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Invalid body.' },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const title = input.title;
  const completed = input.completed === undefined ? false : input.completed;

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 120 ||
    typeof completed !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Invalid title or completed flag.' },
      { status: 400 }
    );
  }

  const result = db.prepare(
    'INSERT INTO tasks (title, completed) VALUES (?, ?)'
  ).run(title.trim(), completed ? 1 : 0);

  const task = db.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).get(result.lastInsertRowid) as TaskRow;

  return NextResponse.json(serialize(task), { status: 201 });
}
