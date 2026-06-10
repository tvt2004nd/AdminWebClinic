import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchAdminSchedules } from '../../api';
import styles from './CalendarPage.module.css';
import ScheduleModal from '../../components/ScheduleModal/ScheduleModal';

const STATUS_COLORS = {
    AVAILABLE: '#10b981', // green
    FULL: '#f59e0b',
    CANCELLED: '#ef4444',
    COMPLETED: '#6366f1',
};

function mapSchedulesToEvents(schedules) {
    return (schedules || []).map((s) => {
        const date = s.workDate;
        const start = `${date}T${(s.shiftStart || s.startTime || s.start || '00:00').slice(0, 8)}`;
        const end = `${date}T${(s.shiftEnd || s.endTime || s.end || '00:00').slice(0, 8)}`;
        const title = `${s.doctorName || s.doctor?.fullName || 'Doctor'} — ${s.roomName || (s.room && s.room.roomName) || ''}`;
        const color = STATUS_COLORS[s.status] || '#999';
        return {
            id: s.scheduleId || `${s.workDate}-${s.shiftStart}-${s.shiftEnd}`,
            title,
            start,
            end,
            extendedProps: s,
            backgroundColor: color,
            borderColor: color,
        };
    });
}

const CalendarPage = () => {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchEvents = async (fetchInfo, successCallback, failureCallback) => {
        try {
            const startDate = fetchInfo.startStr.slice(0, 10);
            const endDate = fetchInfo.endStr.slice(0, 10);
            const schedules = await fetchAdminSchedules({ startDate, endDate });
            const evts = mapSchedulesToEvents(schedules || []);
            setEvents(evts);
            successCallback(evts);
        } catch (e) {
            failureCallback(e);
        }
    };

    const handleEventClick = (info) => {
        setSelectedEvent(info.event.extendedProps);
        setModalOpen(true);
    };

    const handleDateSelect = (selectionInfo) => {
        // open create modal prefilled
        setSelectedEvent({ workDate: selectionInfo.startStr });
        setModalOpen(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}><h1 className={styles.title}>Lịch Bác sĩ</h1></div>
            <div className={styles.card}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                    selectable={true}
                    select={handleDateSelect}
                    events={fetchEvents}
                    eventClick={handleEventClick}
                    height="auto"
                />
            </div>

            {modalOpen && (
                <ScheduleModal schedule={selectedEvent} onClose={() => { setModalOpen(false); setSelectedEvent(null); }} />
            )}
        </div>
    );
};

export default CalendarPage;
