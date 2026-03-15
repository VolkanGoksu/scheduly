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
        initialView={typeof window !== 'undefined' && window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek'}
        locale="tr"
        locales={[trLocale]}
        firstDay={1}
        selectable={true}
        events={events} // Booked slots will be passed here as events
        validRange={{
          start: new Date().toISOString().split('T')[0]
        }}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        dateClick={handleDateClick}
        allDaySlot={false}
        height="auto"
        expandRows={true}
        stickyHeaderDates={true}
        nowIndicator={true}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'today'
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayHeaderFormat={{
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }}
        eventClassNames="premium-event"
        slotDuration="00:30:00"
        handleWindowResize={true}
        dayHeaderClassNames="premium-header"
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
          background: #fee2e2 !important; /* light red */
          border: 1px solid #f87171 !important; /* red-400 */
          color: #991b1b !important; /* dark red */
          border-radius: 6px !important;
          font-weight: 900 !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
        .dark .premium-event {
          background: #7f1d1d !important; /* very dark red */
          border: 1px solid #dc2626 !important;
          color: #fecaca !important; /* light red text */
        }
        .fc-timegrid-slot {
          cursor: pointer;
          transition: background-color 0.1s;
        }
        .fc-timegrid-slot:hover {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .premium-header {
          background: #ffffff !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .dark .premium-header {
          background: #09090b !important;
          border-bottom: 2px solid #27272a !important;
        }
        .fc-col-header-cell-cushion {
          padding: 12px 0 !important;
          font-weight: 900 !important;
          color: #0f172a !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
        }
        .dark .fc-col-header-cell-cushion {
          color: #f8fafc !important;
        }
        .fc-timegrid-slot-label-cushion {
          font-weight: 700 !important;
          color: #64748b !important;
        }
        .dark .fc-timegrid-slot-label-cushion {
          color: #94a3b8 !important;
        }
      `}</style>
    </div>
  );
};

export default Calendar;