/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

interface ClockProps {
  isDarkMode: boolean;
}

export default function Clock({ isDarkMode }: ClockProps) {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatClock = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, '0');

    return {
      timeString: `${hoursStr}:${minutes}:${seconds}`,
      ampm,
      dateString: time.toLocaleDateString('ar-OM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    };
  };

  const { timeString, ampm, dateString } = formatClock();

  return (
    <div className={`flex flex-col items-end justify-center font-mono text-right p-2 select-none`}>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-widest text-[var(--primary-color)] transition-all duration-300">
          {timeString}
        </span>
        <span className="text-[10px] font-medium opacity-85 px-1.5 py-0.5 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)] animate-pulse">
          {ampm}
        </span>
      </div>
      <div className="text-[10px] opacity-60 mt-0.5 font-sans">
        {dateString}
      </div>
    </div>
  );
}
