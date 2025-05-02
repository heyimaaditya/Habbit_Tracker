'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, subDays, parseISO } from 'date-fns';

interface HistoryEntry {
  date: string;
  value: number | boolean;
}

type GoalType = 'count' | 'boolean';

interface Habit {
  id: string;
  name: string;
  goalType: GoalType;
  goalValue: number | boolean;
  history: HistoryEntry[];
  color: string;
}

const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const generateMockHistory = (
  days: number,
  goalType: GoalType,
  goalValue: number | boolean
): HistoryEntry[] => {
  const history: HistoryEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateString = format(date, 'yyyy-MM-dd');
    let value: number | boolean;

    if (goalType === 'count') {
      const targetValue = goalValue as number;
      value = Math.floor(Math.random() * (targetValue + Math.ceil(targetValue / 2) + 1));
    } else {
      value = Math.random() > 0.3;
    }

    history.push({ date: dateString, value });
  }
  return history;
};

const calculateStreak = (
  history: HistoryEntry[],
  goalValue: number | boolean,
  goalType: GoalType
): number => {
  if (!history || history.length === 0) {
    return 0;
  }

  const sortedHistory = [...history].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  let streak = 0;
  let expectedDate = new Date();

  const lastEntry = sortedHistory[0];
  const lastEntryDate = parseISO(lastEntry.date);

  let startIndex = 0;

  if (isSameDay(lastEntryDate, expectedDate)) {
      if (checkGoalMet(lastEntry.value, goalValue, goalType)) {
          streak = 1;
          expectedDate = subDays(expectedDate, 1);
          startIndex = 1;
      } else {
          return sortedHistory.length === 1 ? 0 : 0;
      }
  } else if (isSameDay(lastEntryDate, subDays(expectedDate, 1))) {
       if (checkGoalMet(lastEntry.value, goalValue, goalType)) {
           streak = 1;
           expectedDate = subDays(expectedDate, 2);
           startIndex = 1;
       } else {
           return 0;
       }
  } else {
      return 0;
  }

  for (let i = startIndex; i < sortedHistory.length; i++) {
    const entry = sortedHistory[i];
    const entryDate = parseISO(entry.date);

    if (isSameDay(entryDate, expectedDate) && checkGoalMet(entry.value, goalValue, goalType)) {
      streak++;
      expectedDate = subDays(expectedDate, 1);
    } else if (entryDate.getTime() < expectedDate.getTime()) {
        break;
    }
  }

  return streak;
};

const checkGoalMet = (
  loggedValue: number | boolean,
  goalValue: number | boolean,
  goalType: GoalType
): boolean => {
  if (goalType === 'count') {
    return (loggedValue as number) >= (goalValue as number);
  } else {
    return loggedValue === true && goalValue === true;
  }
};

const initialHabits: Habit[] = [
  {
    id: generateId(),
    name: 'Drink Water (cups)',
    goalType: 'count',
    goalValue: 8,
    history: generateMockHistory(30, 'count', 8),
    color: '#3b82f6',
  },
  {
    id: generateId(),
    name: 'Exercise (minutes)',
    goalType: 'count',
    goalValue: 30,
    history: generateMockHistory(30, 'count', 30),
    color: '#10b981',
  },
  {
    id: generateId(),
    name: 'Read (pages)',
    goalType: 'count',
    goalValue: 20,
    history: generateMockHistory(30, 'count', 20),
    color: '#f59e0b',
  },
  {
    id: generateId(),
    name: 'Meditate',
    goalType: 'boolean',
    goalValue: true,
    history: generateMockHistory(30, 'boolean', true),
    color: '#8b5cf6',
  },
];

export default function HabitTrackerPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
    initialHabits.length > 0 ? initialHabits[0].id : null
  );
  const [newHabitFormData, setNewHabitFormData] = useState({
    name: '',
    goalType: 'count' as GoalType,
    goalValue: '',
    color: '#3b82f6',
  });

  const selectedHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId),
    [habits, selectedHabitId]
  );

  const chartData = useMemo(() => {
    if (!selectedHabit) return [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const thirtyDaysAgo = subDays(new Date(), 29);

    const historyMap = new Map(
      selectedHabit.history.map((entry) => [entry.date, entry])
    );

    const data: { name: string; value: number | boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'MMM dd');

      const entry = historyMap.get(dateString);
      const value =
        entry?.value !== undefined
          ? entry.value
          : selectedHabit.goalType === 'count'
            ? 0
            : false;

      data.push({ name: dayName, value });
    }

    return data;
  }, [selectedHabit]);

  useEffect(() => {
    if (!selectedHabitId && habits.length > 0) {
        setSelectedHabitId(habits[0].id);
    } else if (habits.length === 0) {
        setSelectedHabitId(null);
    }
  }, [habits, selectedHabitId]);

  const handleLogActivity = (habitId: string, value?: number | boolean) => {
    setHabits((currentHabits) =>
      currentHabits.map((habit) => {
        if (habit.id === habitId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const todayString = getTodayString();
          const existingEntryIndex = habit.history.findIndex((entry) =>
            isSameDay(parseISO(entry.date), parseISO(todayString))
          );

          // eslint-disable-line prefer-const
          let updatedHistory = [...habit.history];
          let valueToLog: number | boolean;

          if (habit.goalType === 'boolean') {
             valueToLog = true;
          } else {
             valueToLog = value !== undefined ? value : (habit.goalValue as number);
          }

          if (existingEntryIndex > -1) {
            updatedHistory[existingEntryIndex] = {
              date: todayString,
              value: valueToLog,
            };
          } else {
            updatedHistory.push({ date: todayString, value: valueToLog });
             updatedHistory.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
          }

          return { ...habit, history: updatedHistory };
        }
        return habit;
      })
    );
  };

   const handleAddHabitSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newHabitFormData.name.trim()) {
            alert('Habit name is required.');
            return;
        }
         const parsedGoalValue = newHabitFormData.goalType === 'count' ? parseInt(newHabitFormData.goalValue, 10) : true;

        if (newHabitFormData.goalType === 'count' && (isNaN(parsedGoalValue as number) || (parsedGoalValue as number) <= 0)) {
             alert('Goal value must be a positive number for count-based habits.');
             return;
        }

        const newHabit: Habit = {
            id: generateId(),
            name: newHabitFormData.name.trim(),
            goalType: newHabitFormData.goalType,
            goalValue: parsedGoalValue,
            history: [],
            color: newHabitFormData.color,
        };

        setHabits((currentHabits) => [...currentHabits, newHabit]);

        setSelectedHabitId(newHabit.id);
        setIsAddHabitModalOpen(false);

        setNewHabitFormData({
            name: '',
            goalType: 'count',
            goalValue: '',
            color: '#3b82f6',
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
         const { name, value } = e.target;

         if (name === 'goalType') {
            setNewHabitFormData({
                 ...newHabitFormData,
                 goalType: value as GoalType,
                 goalValue: value === 'boolean' ? '' : newHabitFormData.goalValue,
             });
         } else {
             setNewHabitFormData({
                 ...newHabitFormData,
                 [name]: value,
             });
         }
     };

     const handleColorChange = (color: string) => {
         setNewHabitFormData({
             ...newHabitFormData,
             color: color,
         });
     };

     const openAddHabitModal = () => {
         setNewHabitFormData({
             name: '',
             goalType: 'count',
             goalValue: '',
             color: '#3b82f6',
         });
         setIsAddHabitModalOpen(true);
     }

  const todayString = getTodayString();
  const todayHistoryMap = new Map(
    habits.flatMap(habit =>
        habit.history
            .filter(entry => isSameDay(parseISO(entry.date), parseISO(todayString)))
            .map(entry => [`${habit.id}-${entry.date}`, entry])
    )
  );

  const wasGoalMetToday = (habit: Habit): boolean => {
       const entry = todayHistoryMap.get(`${habit.id}-${todayString}`);
       if (!entry) return false;
       return checkGoalMet(entry.value, habit.goalValue, habit.goalType);
  }

  const userAvatarUrl = useMemo(() => `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 100)}.jpg`, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-sans flex flex-col">
      <nav className="bg-white shadow-sm py-4 px-6 md:px-10 flex justify-between items-center z-10">
        <div className="text-2xl font-bold text-blue-600">Habit Tracker</div>
        <div className="flex items-center space-x-4">
           <div className="hidden md:flex items-center space-x-2">
                <img src={userAvatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full border-2 border-blue-400"/>
                 <span className="text-gray-700 font-medium">Welcome, Alex!</span>
           </div>
          <button
            onClick={openAddHabitModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
          >
            Add Habit
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-6 md:px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-1 bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Your Habits</h2>

          {habits.length === 0 ? (
             // FIX: Added " around "Add Habit"
             <p className="text-gray-500">No habits added yet. Click "Add Habit" to get started!</p>
          ) : (
            <ul className="space-y-4">
              {habits.map((habit) => {
                 const currentStreak = calculateStreak(habit.history, habit.goalValue, habit.goalType);
                 const metGoalToday = wasGoalMetToday(habit);

                 return (
                   <li
                     key={habit.id}
                     className={`p-4 border rounded-lg cursor-pointer transition duration-200 ${
                       selectedHabitId === habit.id
                         ? 'border-blue-500 bg-blue-50 shadow-md'
                         : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                     }`}
                     onClick={() => setSelectedHabitId(habit.id)}
                   >
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="text-lg font-medium text-gray-700">{habit.name}</h3>
                       <span className={`px-3 py-1 text-sm font-semibold rounded-full ${metGoalToday ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {metGoalToday ? 'Done Today' : 'Pending'}
                       </span>
                     </div>
                     <p className="text-sm text-gray-600 mb-3">
                       Goal: {habit.goalType === 'count' ? `${habit.goalValue} ${habit.name.split(' ').pop()}` : 'Complete'} daily
                     </p>
                     <div className="flex items-center justify-between">
                        <div className="text-gray-700 font-semibold">
                             🔥 Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                        </div>
                         {!metGoalToday && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLogActivity(habit.id);
                              }}
                              className="ml-4 bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                              Check In
                            </button>
                          )}
                     </div>
                   </li>
                 );
              })}
            </ul>
          )}
        </section>

        <section className="md:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedHabit ? (
            <>
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Progress for {selectedHabit.name}
              </h2>

              <div className="h-80 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                       dataKey="name"
                       fontSize={12}
                       axisLine={false}
                       tickLine={false}
                       padding={{ left: 30, right: 30 }}
                     />
                    <YAxis
                       fontSize={12}
                       axisLine={false}
                       tickLine={false}
                       label={{ value: selectedHabit.goalType === 'count' ? 'Value' : 'Completed', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fill: '#6b7280' } }}
                       tickFormatter={(value) => selectedHabit.goalType === 'boolean' ? (value ? 'Yes' : 'No') : value}
                     />
                    <Tooltip
                       formatter={(value) => selectedHabit.goalType === 'boolean' ? (value ? 'Completed' : 'Not Completed') : value}
                       labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={selectedHabit.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                       activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                   <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-blue-700">
                          {calculateStreak(selectedHabit.history, selectedHabit.goalValue, selectedHabit.goalType)}
                       </div>
                       <div className="text-sm text-blue-600">Current Streak</div>
                   </div>
                   <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-green-700">
                           {selectedHabit.history.filter(entry => checkGoalMet(entry.value, selectedHabit?.goalValue, selectedHabit?.goalType)).length}
                       </div>
                       <div className="text-sm text-green-600">Total Completed Days</div>
                   </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v2m-9 9h10a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
               Select a habit from the left to see its progress chart.
               <button
                   onClick={openAddHabitModal}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                 >
                 Add Your First Habit
               </button>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-6 px-6 md:px-10 mt-8 text-center">
        <p>© {new Date().getFullYear()} Habit Tracker. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-2">Built with Next.js, Tailwind CSS, TypeScript, Recharts, & Framer Motion.</p> {/* & is correct */}
         <div className="mt-4 text-sm space-x-4 text-gray-400">
             <a href="#" onClick={(e) => {e.preventDefault(); alert('Privacy Policy Placeholder')}} className="hover:underline">Privacy Policy</a>
             <a href="#" onClick={(e) => {e.preventDefault(); alert('Terms of Service Placeholder')}} className="hover:underline">Terms of Service</a>
         </div>
      </footer>

        <AnimatePresence>
             {isAddHabitModalOpen && (
                 <motion.div
                     className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                 >
                     <motion.div
                         className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
                         initial={{ scale: 0.9, opacity: 0, y: 50 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.9, opacity: 0, y: 50 }}
                         transition={{ duration: 0.2 }}
                     >
                         <button
                             onClick={() => setIsAddHabitModalOpen(false)}
                             className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                             aria-label="Close modal"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                         </button>

                         <h3 className="text-2xl font-bold mb-6 text-gray-800">Add New Habit</h3>

                         <form onSubmit={handleAddHabitSubmit} className="space-y-4">
                             <div>
                                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">Habit Name</label>
                                 <input
                                     type="text"
                                     id="name"
                                     name="name"
                                     value={newHabitFormData.name}
                                     onChange={handleInputChange}
                                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                                     required
                                 />
                             </div>

                             <div>
                                 <label htmlFor="goalType" className="block text-sm font-medium text-gray-700">Goal Type</label>
                                 <select
                                     id="goalType"
                                     name="goalType"
                                     value={newHabitFormData.goalType}
                                     onChange={handleInputChange}
                                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                                 >
                                     <option value="count">Count / Value (e.g., cups, minutes, pages)</option>
                                     <option value="boolean">Yes / No (e.g., did you do it?)</option>
                                 </select>
                             </div>

                             {newHabitFormData.goalType === 'count' && (
                                 <div>
                                     <label htmlFor="goalValue" className="block text-sm font-medium text-gray-700">Daily Goal Value</label>
                                     <input
                                         type="number"
                                         id="goalValue"
                                         name="goalValue"
                                         value={newHabitFormData.goalValue}
                                         onChange={handleInputChange}
                                         className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                                     />
                                 </div>
                             )}

                             <div>
                                 <label htmlFor="color" className="block text-sm font-medium text-gray-700">Chart Color</label>
                                  <div className="mt-1 flex items-center space-x-3">
                                      {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'].map(color => (
                                           <button
                                               key={color}
                                               type="button"
                                               className={`w-8 h-8 rounded-full border-2 ${newHabitFormData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                               style={{ backgroundColor: color }}
                                               onClick={() => handleColorChange(color)}
                                               aria-label={`Select color ${color}`}
                                           />
                                       ))}
                                   </div>
                             </div>

                             <div className="pt-4">
                                 <button
                                     type="submit"
                                     className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 font-semibold"
                                 >
                                     Add Habit
                                 </button>
                             </div>
                         </form>
                     </motion.div>
                 </motion.div>
             )}
         </AnimatePresence>
    </div>
  );
}