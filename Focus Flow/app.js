import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Check, Settings, Sun, Moon, Coffee, Sprout } from 'lucide-react';

const FocusFlowPomodoro = () => {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosUntilLongBreak: 4,
    soundEnabled: true
  });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [gardenGrowth, setGardenGrowth] = useState(0);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('pomodoro-tasks');
    const savedHistory = localStorage.getItem('pomodoro-history');
    const savedSettings = localStorage.getItem('pomodoro-settings');
    const savedTheme = localStorage.getItem('pomodoro-theme');
    const savedGrowth = localStorage.getItem('pomodoro-garden');
    const savedPomodoros = localStorage.getItem('pomodoro-count');

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedHistory) setSessionHistory(JSON.parse(savedHistory));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedTheme) setTheme(savedTheme);
    if (savedGrowth) setGardenGrowth(parseInt(savedGrowth));
    if (savedPomodoros) setCompletedPomodoros(parseInt(savedPomodoros));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('pomodoro-history', JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  useEffect(() => {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pomodoro-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pomodoro-garden', gardenGrowth.toString());
  }, [gardenGrowth]);

  useEffect(() => {
    localStorage.setItem('pomodoro-count', completedPomodoros.toString());
  }, [completedPomodoros]);

  // Timer logic
  useEffect(() => {
    if (isActive && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(t => t - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, time]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      if (e.key === ' ') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'r') {
        resetTimer();
      } else if (e.key === 'n') {
        document.getElementById('new-task-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playSound();
    
    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      setGardenGrowth(g => g + 10);
      
      // Log session
      const session = {
        timestamp: new Date().toISOString(),
        task: currentTask,
        duration: settings.workDuration
      };
      setSessionHistory(prev => [...prev, session].slice(-50)); // Keep last 50

      // Switch to break
      if (newCount % settings.pomodorosUntilLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('work');
    }
  };

  const playSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play();
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(getDurationForMode(mode));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTime(getDurationForMode(newMode));
  };

  const getDurationForMode = (mode) => {
    switch(mode) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return 25 * 60;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTask = () => {
    if (newTaskInput.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTaskInput, completed: false }]);
      setNewTaskInput('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (currentTask?.id === id) setCurrentTask(null);
  };

  const selectTask = (task) => {
    setCurrentTask(task);
  };

  const getBreakSuggestion = () => {
    const suggestions = [
      '💧 Drink some water',
      '👀 Look away from screen (20-20-20 rule)',
      '🧘 Quick stretch or walk',
      '🌱 Take 5 deep breaths',
      '☕ Make a drink',
      '🪟 Look outside for a moment'
    ];
    return suggestions[completedPomodoros % suggestions.length];
  };

  const themeColors = {
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800',
      text: 'text-gray-100',
      subtext: 'text-gray-400',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-700',
      border: 'border-gray-700'
    },
    light: {
      bg: 'bg-gray-50',
      card: 'bg-white',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      accent: 'bg-blue-500',
      accentHover: 'hover:bg-blue-600',
      border: 'border-gray-200'
    },
    nature: {
      bg: 'bg-green-50',
      card: 'bg-white',
      text: 'text-green-900',
      subtext: 'text-green-600',
      accent: 'bg-green-600',
      accentHover: 'hover:bg-green-700',
      border: 'border-green-200'
    }
  };

  const t = themeColors[theme] || themeColors.dark;

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} p-4 transition-colors duration-300`}>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyg==" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sprout className="w-8 h-8" />
            Focus Flow
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'nature' : 'dark')}
              className={`p-2 ${t.card} rounded-lg ${t.border} border transition-colors`}
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 ${t.card} rounded-lg ${t.border} border transition-colors`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`${t.card} rounded-xl p-6 mb-6 ${t.border} border`}>
            <h3 className="text-xl font-semibold mb-4">Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${t.subtext} text-sm mb-1`}>Work Duration (min)</label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value) || 25})}
                  className={`w-full px-3 py-2 ${t.card} ${t.border} border rounded-lg`}
                />
              </div>
              <div>
                <label className={`block ${t.subtext} text-sm mb-1`}>Short Break (min)</label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings({...settings, shortBreakDuration: parseInt(e.target.value) || 5})}
                  className={`w-full px-3 py-2 ${t.card} ${t.border} border rounded-lg`}
                />
              </div>
              <div>
                <label className={`block ${t.subtext} text-sm mb-1`}>Long Break (min)</label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings({...settings, longBreakDuration: parseInt(e.target.value) || 15})}
                  className={`w-full px-3 py-2 ${t.card} ${t.border} border rounded-lg`}
                />
              </div>
              <div>
                <label className={`block ${t.subtext} text-sm mb-1`}>Pomodoros until long break</label>
                <input
                  type="number"
                  value={settings.pomodorosUntilLongBreak}
                  onChange={(e) => setSettings({...settings, pomodorosUntilLongBreak: parseInt(e.target.value) || 4})}
                  className={`w-full px-3 py-2 ${t.card} ${t.border} border rounded-lg`}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="md:col-span-2">
            <div className={`${t.card} rounded-xl p-8 ${t.border} border`}>
              {/* Mode Selector */}
              <div className="flex gap-2 mb-6">
                {['work', 'shortBreak', 'longBreak'].map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 rounded-lg transition-colors ${
                      mode === m ? `${t.accent} text-white` : `${t.border} border`
                    }`}
                  >
                    {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                  </button>
                ))}
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="text-7xl font-bold mb-4 tabular-nums">
                  {formatTime(time)}
                </div>
                {currentTask && (
                  <div className={`${t.subtext} text-lg`}>
                    Working on: {currentTask.text}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-4 justify-center mb-6">
                <button
                  onClick={toggleTimer}
                  className={`${t.accent} ${t.accentHover} text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors`}
                >
                  {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={resetTimer}
                  className={`${t.border} border px-6 py-3 rounded-lg flex items-center gap-2 transition-colors hover:bg-opacity-10`}
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {/* Keyboard Shortcuts */}
              <div className={`${t.subtext} text-sm text-center`}>
                <div>Shortcuts: Space (Start/Pause) • R (Reset) • N (New Task)</div>
              </div>

              {/* Break Suggestion */}
              {mode !== 'work' && (
                <div className={`mt-6 p-4 ${t.accent} bg-opacity-10 rounded-lg text-center`}>
                  <Coffee className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Break Suggestion</div>
                  <div className={t.subtext}>{getBreakSuggestion()}</div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className={`${t.card} rounded-lg p-4 ${t.border} border text-center`}>
                <div className="text-3xl font-bold">{completedPomodoros}</div>
                <div className={`${t.subtext} text-sm`}>Completed Today</div>
              </div>
              <div className={`${t.card} rounded-lg p-4 ${t.border} border text-center`}>
                <div className="text-3xl font-bold">{sessionHistory.length}</div>
                <div className={`${t.subtext} text-sm`}>Total Sessions</div>
              </div>
              <div className={`${t.card} rounded-lg p-4 ${t.border} border text-center`}>
                <div className="text-3xl">🌱</div>
                <div className={`${t.subtext} text-sm`}>Growth: {gardenGrowth}%</div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div>
            <div className={`${t.card} rounded-xl p-6 ${t.border} border`}>
              <h2 className="text-xl font-semibold mb-4">Tasks</h2>
              
              {/* Add Task */}
              <div className="flex gap-2 mb-4">
                <input
                  id="new-task-input"
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a task..."
                  className={`flex-1 px-3 py-2 ${t.border} border rounded-lg bg-transparent`}
                />
                <button
                  onClick={addTask}
                  className={`${t.accent} ${t.accentHover} text-white p-2 rounded-lg transition-colors`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 p-3 rounded-lg ${t.border} border cursor-pointer transition-colors ${
                      currentTask?.id === task.id ? `${t.accent} bg-opacity-20` : 'hover:bg-opacity-5'
                    }`}
                    onClick={() => selectTask(task)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.completed ? `${t.accent} border-transparent` : t.border
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 ${task.completed ? 'line-through opacity-50' : ''}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="opacity-50 hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {tasks.length === 0 && (
                <div className={`${t.subtext} text-center py-8 text-sm`}>
                  No tasks yet. Add one to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusFlowPomodoro;
