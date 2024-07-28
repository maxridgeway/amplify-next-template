"use client";

import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { Plus, ArrowUp, ArrowDown, X } from 'lucide-react';
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from '@aws-amplify/ui-react';

Amplify.configure(outputs);

const client = generateClient<Schema>();

// Function to get background color class
function getBackgroundColor(index: number) {
  const colors = [
    'bg-red-100', 'bg-yellow-100', 'bg-green-100', 'bg-blue-100', 
    'bg-indigo-100', 'bg-purple-100', 'bg-pink-100', 'bg-orange-100'
  ];
  return colors[index % colors.length];
}

export default function Home() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [newTodoContent, setNewTodoContent] = useState("");

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => {
        const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setTodos(sortedItems);
      },
    });

    return () => sub.unsubscribe();
  }, []);

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    if (newTodoContent.trim()) {
      await client.models.Todo.create({
        content: newTodoContent.trim(),
        order: (todos.length + 1) * 1000,
      });
      setNewTodoContent("");
    }
  }

  async function moveTodo(id: string, direction: 'up' | 'down') {
    const currentIndex = todos.findIndex(t => t.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= todos.length) return;

    const updatedTodos = [...todos];
    const [movedItem] = updatedTodos.splice(currentIndex, 1);
    updatedTodos.splice(newIndex, 0, movedItem);

    const updates = updatedTodos.map((todo, index) => 
      client.models.Todo.update({
        id: todo.id,
        order: (index + 1) * 1000,
      })
    );

    await Promise.all(updates);
  }

  async function deleteTodo(id: string) {
    await client.models.Todo.delete({ id });
    const remainingTodos = todos.filter(todo => todo.id !== id);
    const updates = remainingTodos.map((todo, index) => 
      client.models.Todo.update({
        id: todo.id,
        order: (index + 1) * 1000,
      })
    );
    await Promise.all(updates);
  }

  return (

    <Authenticator>
      {({ signOut, user }) => (
    <main>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl font-semibold mb-6">My Todos</h1>

              <button onClick={signOut}>Sign out</button>
              
              <form onSubmit={createTodo} className="mb-6">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    className="flex-grow px-4 py-2 bg-transparent focus:outline-none"
                    placeholder="Add a new todo"
                    value={newTodoContent}
                    onChange={(e) => setNewTodoContent(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </form>
              
              <ul className="space-y-3">
                {todos.map((todo, index) => (
                  <li key={todo.id} className={`flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-shadow ${getBackgroundColor(index)}`}>
                    <span className="flex-grow text-gray-800">{todo.content}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveTodo(todo.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-full bg-white hover:bg-gray-200 focus:outline-none disabled:opacity-50"
                      >
                        <ArrowUp size={20} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveTodo(todo.id, 'down')}
                        disabled={index === todos.length - 1}
                        className="p-1 rounded-full bg-white hover:bg-gray-200 focus:outline-none disabled:opacity-50"
                      >
                        <ArrowDown size={20} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-1 rounded-full bg-white hover:bg-red-100 focus:outline-none"
                      >
                        <X size={20} className="text-red-500" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 text-sm text-gray-600">
                🥳 App successfully hosted. Try creating a new todo and reordering it.
                <br />
                <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/" className="text-blue-500 hover:underline">
                  Review next steps of this tutorial.
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
      )}
    </Authenticator>
  );
}