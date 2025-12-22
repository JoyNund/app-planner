
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, Priority } from './types';
import { TaskItem } from './components/TaskItem';
import { AIChatPanel } from './components/AIChatPanel';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  
  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => filter === 'all' ? true : t.status === filter)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percentage };
  }, [tasks]);

  const addTask = (title: string, priority: Priority) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      title,
      description: '',
      status: TaskStatus.TODO,
      priority,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setShowForm(false);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === TaskStatus.TODO ? TaskStatus.DONE : TaskStatus.TODO } : t
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddAITasks = (newAITasks: Task[]) => {
    setTasks(prev => [...newAITasks, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="glass-morphism sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">T</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">TaskFlow<span className="text-indigo-600">AI</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Overview</a>
            <a href="#" className="text-indigo-600">Tasks</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Calendar</a>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
            <img src="https://picsum.photos/seed/user/100/100" alt="Profile" />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">My Workspace</h2>
            <p className="text-slate-500">Welcome back! You have {stats.pending} tasks pending for today.</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tasks</p>
              <h4 className="text-2xl font-bold text-slate-800">{stats.total}</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
              <h4 className="text-2xl font-bold text-slate-800">{stats.completed}</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productivity</p>
              <span className="text-sm font-bold text-indigo-600">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-1000 ease-out" 
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task Board */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          {/* Board Tabs */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Tasks
            </button>
            <button 
              onClick={() => setFilter(TaskStatus.TODO)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === TaskStatus.TODO ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              To Do
            </button>
            <button 
              onClick={() => setFilter(TaskStatus.DONE)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === TaskStatus.DONE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Completed
            </button>
          </div>

          <div className="flex-1 p-6">
            {showForm && (
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    placeholder="What needs to be done?" 
                    className="w-full bg-transparent text-lg font-medium border-none focus:ring-0 placeholder:text-slate-300"
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && addTask(newTitle, newPriority)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Priority:</span>
                      {Object.values(Priority).map((p) => (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${newPriority === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                        >
                          {p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowForm(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-1"
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={!newTitle.trim()}
                        onClick={() => addTask(newTitle, newPriority)}
                        className="bg-indigo-600 text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        Save Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredTasks.length > 0 ? (
              <div className="space-y-1">
                {filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-500">No tasks found</h3>
                <p className="text-sm text-slate-400 max-w-xs">Looks like your list is clear! Use the chat button on the right to have AI plan something for you.</p>
              </div>
            )}
          </div>
          
          {/* Footer of board */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center">
            <p className="text-xs text-slate-400">
              Tip: Click the ⚡ AI button to generate tasks instantly.
            </p>
          </div>
        </div>
      </main>

      {/* AI Assistant Component */}
      <AIChatPanel onAddTasks={handleAddAITasks} />

      {/* Footer */}
      <footer className="mt-auto px-6 py-12 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-xs">T</div>
              <span className="font-bold text-slate-800">TaskFlow AI</span>
            </div>
            <p className="text-sm text-slate-500 text-center md:text-left">The next generation of task management assisted by Gemini 3 Pro.</p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600">Privacy</a>
            <a href="#" className="hover:text-indigo-600">Terms</a>
            <a href="#" className="hover:text-indigo-600">Help Center</a>
          </div>
          <p className="text-xs text-slate-400">© 2025 TaskFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
