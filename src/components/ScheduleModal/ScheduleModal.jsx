import React from 'react';
import styles from '../../pages/Doctors/Doctors.module.css';

const ScheduleModal = ({ schedule, onClose }) => {
    if (!schedule) return null;
    const s = schedule;
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Chi tiết lịch khám</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>
                <div className={styles.modalBody}>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div><strong>Bác sĩ:</strong> {s.doctorName || s.doctor?.fullName}</div>
                        <div><strong>Ngày:</strong> {s.workDate}</div>
                        <div><strong>Thời gian:</strong> {(s.shiftStart || s.startTime) ? `${(s.shiftStart || s.startTime).slice(0, 5)} - ${(s.shiftEnd || s.endTime).slice(0, 5)}` : '--'}</div>
                        <div><strong>Phòng:</strong> {s.roomName || (s.room && s.room.roomName) || s.roomId}</div>
                        <div><strong>Đã đặt:</strong> {s.bookedCount ?? 0} / {s.maxPatients ?? '--'}</div>
                        <div><strong>Trạng thái:</strong> {s.status}</div>
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
