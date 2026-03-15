"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import { DateClickArg } from "@fullcalendar/interaction";

interface CalendarProps {
  events: { title: string; start: string; backgroundColor?: string; borderColor?: string; extendedProps?: any }[];
  onSelect: (start: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onSelect }) => {
  const handleDateClick = (arg: DateClickArg) => {
    onSelect(arg.dateStr);
  };

  const handleEventClick = (info: any) => {
    onSelect(info.event.startStr);
  };

  return (
    <div className="premium-calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locales={[trLocale]}
        locale="tr"
        firstDay={1}
        selectable={true}
        events={events}
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        allDaySlot={false}
        height="700px"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayHeaderFormat={{
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        }}
        eventClassNames="premium-event"
        slotDuration="00:30:00"
        nowIndicator={true}
        expandRows={true}
        stickyHeaderDates={true}
        handleWindowResize={true}
      />
      <style jsx global>{`
        .premium-calendar-wrapper {
          --fc-border-color: #e4e4e7;
          --fc-button-bg-color: #000;
          --fc-button-border-color: #000;
          --fc-button-hover-bg-color: #27272a;
          --fc-button-hover-border-color: #27272a;
          --fc-button-active-bg-color: #3f3f46;
          --fc-button-active-border-color: #3f3f46;
          --fc-today-bg-color: rgba(0,0,0,0.02);
        }
        .dark .premium-calendar-wrapper {
          --fc-border-color: #27272a;
          --fc-button-bg-color: #fff;
          --fc-button-border-color: #fff;
          --fc-button-hover-bg-color: #e4e4e7;
          --fc-button-hover-border-color: #e4e4e7;
          --fc-button-active-bg-color: #d4d4d8;
          --fc-button-active-border-color: #d4d4d8;
          --fc-today-bg-color: rgba(255,255,255,0.02);
        }
        .fc {
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.05em;
          font-size: 1.5rem;
        }
        .fc .fc-button {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          padding: 0.8rem 1.2rem;
          border-radius: 1rem;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active, 
        .fc .fc-button-primary:not(:disabled):active {
          background-color: var(--fc-button-active-bg-color);
        }
        .fc .fc-col-header-cell {
          padding: 1.5rem 0;
          background: #fdfdfd;
        }
        .dark .fc .fc-col-header-cell {
          background: #09090b;
        }
        .fc .fc-col-header-cell-cushion {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
          color: #71717a;
        }
        .fc .fc-timegrid-slot {
          height: 4rem !important;
          border-bottom: 0;
        }
        .fc .fc-timegrid-slot-label-cushion {
          font-weight: 600;
          font-size: 0.7rem;
          color: #a1a1aa;
        }
        .premium-event {
          border: none !important;
          border-radius: 12px !important;
          padding: 4px 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .premium-event:hover {
          transform: scale(1.02);
        }
        .fc-event-main-frame {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fc-event-title {
          font-weight: 900 !important;
          text-transform: uppercase !important;
          font-size: 0.65rem !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </div>
  );
};

export default Calendar;