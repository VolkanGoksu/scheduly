"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateClickArg } from "@fullcalendar/interaction";

interface CalendarProps {
  events: { title: string; start: string }[];
  onSelect: (start: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onSelect }) => {
  const handleDateClick = (arg: DateClickArg) => {
    onSelect(arg.dateStr);
  };

  return (
    <div className="premium-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={true}
        events={events}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        dateClick={handleDateClick}
        allDaySlot={false}
        height="600px"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        eventClassNames="rounded-md border-none px-1 text-xs font-medium shadow-sm"
      />
    </div>
  );
};

export default Calendar;