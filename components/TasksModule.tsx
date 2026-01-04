import React, { useState, useMemo } from 'react';
import { AppData, Task } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, Edit2, History, ClipboardList, Clock } from 'lucide-react';
import { Modal } from './Modal';

interface Props {
  data: AppData;
  onSaveTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksModule: React.FC<Props> = ({ data, onSaveTask, onToggleTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const activeTasks = useMemo(() => 
    data.tasks.filter(t => !t.isDone).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [data.tasks]);

  const finishedTasks = useMemo(() => 
    data.tasks.filter(t => t.isDone).sort((a, b) => new Date(b.doneAt || '').getTime() - new Date(a.doneAt || '').getTime())
  , [data.tasks]);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    const task: Task = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      isDone: editingTask?.isDone || false,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      doneAt: editingTask?.doneAt
    };
    onSaveTask(task);
    setIsModalOpen(false);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Active Tasks List */}
      <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Active Tasks</h2>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md flex items-center gap-2 font-black uppercase text-[10px] shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 overflow-y-auto divide-y divide-gray-100">
          {activeTasks.map(task => (
            <div key={task.id} className="p-4 flex items-start gap-4 hover:bg-gray-50/50 group transition-colors">
              <button 
                onClick={() => onToggleTask(task.id)}
                className="mt-1 text-gray-300 hover:text-green-500 transition-colors"
              >
                <Circle className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{task.title}</h3>
                {task.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>}
                <div className="flex items-center gap-1.5 mt-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                   <Clock className="w-3 h-3" />
                   {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(task)} className="p-1.5 text-gray-400 hover:text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {activeTasks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center opacity-60">
                <CheckCircle2 className="w-12 h-12 mb-4 text-indigo-100" />
                <p className="text-sm font-medium">All caught up! Add a new task to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task History Sidebar */}
      <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Task History</h2>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 flex-1 overflow-y-auto divide-y divide-gray-200">
          {finishedTasks.map(task => (
            <div key={task.id} className="p-4 flex items-start gap-3 opacity-60">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-gray-600 line-through truncate">{task.title}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                   Done: {new Date(task.doneAt || '').toLocaleString()}
                </div>
              </div>
              <button onClick={() => onDeleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {finishedTasks.length === 0 && (
            <div className="p-12 text-center text-[10px] text-gray-400 italic">No completed tasks yet.</div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTask ? "Edit Task" : "Add New Task"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Title</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Order raw materials"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
            <textarea 
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
              placeholder="Add some details..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={!formData.title}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-md font-black uppercase text-xs shadow-md disabled:bg-gray-300 transition-colors mt-2"
          >
            {editingTask ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </Modal>
    </div>
  );
};