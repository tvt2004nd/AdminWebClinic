import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, Calendar } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import styles from './Rooms.module.css';

const emptyForm = {
    roomCode: '',
    roomName: '',
    location: '',
    floor: '',
    capacity: '1',
    specialtyId: '',
    status: 'ACTIVE',
    description: '',
};

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState(null);

    // Assignment states
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [roomAssignments, setRoomAssignments] = useState([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [availableSchedules, setAvailableSchedules] = useState([]);
    const [availableSchedulesLoading, setAvailableSchedulesLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
    const doctorDropdownRef = useRef(null);
    const [assignmentSaving, setAssignmentSaving] = useState(false);
    const [deleteAssignment, setDeleteAssignment] = useState(null);
    const [editingAssignmentId, setEditingAssignmentId] = useState(null);
    const [editingAssignmentMaxPatients, setEditingAssignmentMaxPatients] = useState('');

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRooms = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (keyword) params.set('keyword', keyword);
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetchWithAuth(`/api/admin/rooms?${params}`);
            if (res.ok) setRooms(await res.json());
        } catch { } finally { setLoading(false); }
    }, [keyword, statusFilter]);

    const fetchSpecialties = async () => {
        try {
            const res = await fetchWithAuth('/api/admin/specialties');
            if (res.ok) setSpecialties(await res.json());
        } catch { }
    };

    useEffect(() => { fetchRooms(); fetchSpecialties(); }, [fetchRooms]);

    const openAdd = () => {
        setEditing(null);
        setForm({ ...emptyForm });
        setModalOpen(true);
    };

    const openEdit = (r) => {
        setEditing(r);
        setForm({
            roomCode: r.roomCode || '',
            roomName: r.roomName || '',
            location: r.location || '',
            floor: r.floor != null ? String(r.floor) : '',
            capacity: r.capacity != null ? String(r.capacity) : '1',
            specialtyId: r.specialtyId != null ? String(r.specialtyId) : '',
            status: r.status || 'ACTIVE',
            description: r.description || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.roomCode.trim()) { showToast('Mã phòng không được để trống', 'error'); return; }
        if (!form.roomName.trim()) { showToast('Tên phòng không được để trống', 'error'); return; }
        setSaving(true);
        try {
            if (editing) {
                const res = await fetchWithAuth(`/api/admin/rooms/${editing.roomId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomCode: form.roomCode.trim(),
                        roomName: form.roomName.trim(),
                        location: form.location.trim() || null,
                        floor: form.floor ? Number(form.floor) : null,
                        capacity: form.capacity ? Number(form.capacity) : 1,
                        specialtyId: form.specialtyId ? Number(form.specialtyId) : null,
                        status: form.status,
                        description: form.description.trim() || null,
                    }),
                });
                if (!res.ok) throw new Error();
                showToast('Cập nhật phòng khám thành công', 'success');
            } else {
                const res = await fetchWithAuth('/api/admin/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomCode: form.roomCode.trim(),
                        roomName: form.roomName.trim(),
                        location: form.location.trim() || null,
                        floor: form.floor ? Number(form.floor) : null,
                        capacity: form.capacity ? Number(form.capacity) : 1,
                        specialtyId: form.specialtyId ? Number(form.specialtyId) : null,
                        status: form.status,
                        description: form.description.trim() || null,
                    }),
                });
                if (!res.ok) throw new Error();
                showToast('Thêm phòng khám thành công', 'success');
            }
            setModalOpen(false);
            fetchRooms();
        } catch (error) {
            showToast(error.message || 'Có lỗi xảy ra', 'error');
        } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetchWithAuth(`/api/admin/rooms/${deleteTarget.roomId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || 'Không thể xóa');
            }
            showToast('Đã xóa phòng khám', 'success');
            setDeleteTarget(null);
            fetchRooms();
        } catch (error) { showToast(error.message || 'Không thể xóa', 'error'); }
    };

    // Assignment functions
    const fetchDoctors = async () => {
        try {
            const res = await fetchWithAuth('/api/admin/doctors');
            if (res.ok) setDoctors(await res.json());
        } catch { }
    };

    const fetchAvailableSchedules = async () => {
        setAvailableSchedulesLoading(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const res = await fetchWithAuth(`/api/admin/doctor-schedules?startDate=${today}&status=AVAILABLE`);
            if (res.ok) {
                const schedules = await res.json();
                // filter schedules that are unassigned (roomId == null)
                const unassigned = (Array.isArray(schedules) ? schedules : []).filter(s => !s.roomId);
                // attach specialtyName from doctors list if available
                const docMap = (doctors || []).reduce((m, d) => (m[d.doctorId] = d, m), {});
                const enriched = unassigned.map(s => ({ ...s, specialtyName: (docMap[s.doctorId] && docMap[s.doctorId].specialtyName) || s.specialtyName || '' }));
                setAvailableSchedules(enriched);
            } else {
                setAvailableSchedules([]);
            }
        } catch (e) {
            setAvailableSchedules([]);
        } finally {
            setAvailableSchedulesLoading(false);
        }
    };

    const fetchRoomAssignments = async (roomId) => {
        setAssignmentsLoading(true);
        try {
            const res = await fetchWithAuth(`/api/admin/doctor-schedules?roomId=${roomId}`);
            if (res.ok) setRoomAssignments(await res.json());
        } catch { } finally { setAssignmentsLoading(false); }
    };

    useEffect(() => {
        if (!doctorDropdownOpen) return;

        const handleClickOutside = (event) => {
            if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
                setDoctorDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [doctorDropdownOpen]);

    const openAssignmentModal = (room) => {
        setSelectedRoom(room);
        setSelectedSchedule(null);
        setDoctorSearchQuery('');
        setDoctorDropdownOpen(false);
        fetchDoctors();
        fetchAvailableSchedules();
        fetchRoomAssignments(room.roomId);
        setAssignmentModalOpen(true);
    };

    const closeAssignmentModal = () => {
        setSelectedRoom(null);
        setAssignmentModalOpen(false);
    };

    const formatDoctorLabel = (doctor) => `BS. ${doctor.fullName}${doctor.specialtyName ? ` - ${doctor.specialtyName}` : ''}`;

    const parseTimeToMinutes = (value) => {
        const [hours, minutes] = value.split(':').map((part) => Number(part));
        return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
    };



    const confirmDeleteAssignment = async () => {
        if (!deleteAssignment) return;
        try {
            const res = await fetchWithAuth(`/api/admin/doctor-schedules/${deleteAssignment.scheduleId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            showToast('Gỡ phân công thành công', 'success');
            setDeleteAssignment(null);
            fetchRoomAssignments(selectedRoom.roomId);
        } catch (error) { showToast('Không thể gỡ phân công', 'error'); }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'ACTIVE': return styles.statusActive;
            case 'MAINTENANCE': return styles.statusMaintenance;
            case 'INACTIVE': return styles.statusInactive;
            default: return '';
        }
    };

    return (
        <div className={styles.page}>
            {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.message}</div>}

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Quản lý Phòng Khám</h1>
                    <p className={styles.subtitle}>Quản lý phòng khám và thông tin chi tiết.</p>
                </div>
                <button className={styles.primaryBtn} onClick={openAdd}>
                    <Plus size={20} /><span>Thêm Phòng</span>
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={20} />
                        <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    </div>
                    <div className={styles.filters}>
                        <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Tất cả Trạng thái</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="MAINTENANCE">Bảo trì</option>
                            <option value="INACTIVE">Không hoạt động</option>
                        </select>
                        <span className={styles.totalCount}>{rooms.length} phòng</span>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mã Phòng</th><th>Tên Phòng</th><th>Chuyên khoa</th><th>Sức chứa</th><th>Vị trí</th><th>Trạng thái</th><th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Đang tải...</td></tr>
                                : rooms.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Không tìm thấy</td></tr>
                                    : rooms.map(r => (
                                        <tr key={r.roomId}>
                                            <td className={styles.fw500}>{r.roomCode}</td>
                                            <td>{r.roomName}</td>
                                            <td><span className={styles.badge}>{r.specialtyName || '--'}</span></td>
                                            <td>{r.capacity} chỗ</td>
                                            <td>{r.location || '--'}</td>
                                            <td><span className={`${styles.statusBadge} ${getStatusBadgeColor(r.status)}`}>{r.status}</span></td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button className={styles.iconBtn} title="Phân công bác sĩ" onClick={() => openAssignmentModal(r)}><Users size={16} /></button>
                                                    <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(r)}><Edit2 size={16} /></button>
                                                    <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(r)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div className={styles.overlay} onClick={() => setModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editing ? 'Sửa phòng khám' : 'Thêm phòng khám'}</h2>
                            <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Mã phòng *</label>
                                        <input className={styles.formInput} value={form.roomCode} onChange={e => setForm({ ...form, roomCode: e.target.value })} placeholder="VD: P001" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Tên phòng *</label>
                                        <input className={styles.formInput} value={form.roomName} onChange={e => setForm({ ...form, roomName: e.target.value })} placeholder="VD: Phòng khám 1" />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Chuyên khoa</label>
                                        <select className={styles.formSelect} value={form.specialtyId} onChange={e => setForm({ ...form, specialtyId: e.target.value })}>
                                            <option value="">-- Chọn --</option>
                                            {specialties.map(s => <option key={s.specialtyId} value={s.specialtyId}>{s.specialtyName}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Sức chứa</label>
                                        <input className={styles.formInput} type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Vị trí</label>
                                        <input className={styles.formInput} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="VD: Tầng 1" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Tầng</label>
                                        <input className={styles.formInput} type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái</label>
                                    <select className={styles.formSelect} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="ACTIVE">Hoạt động</option>
                                        <option value="MAINTENANCE">Bảo trì</option>
                                        <option value="INACTIVE">Không hoạt động</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mô tả</label>
                                    <textarea className={styles.formTextarea} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả về phòng khám..." />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Hủy</button>
                                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}><Trash2 size={24} /></div>
                        <h3 className={styles.confirmTitle}>Xóa phòng khám</h3>
                        <p className={styles.confirmText}>Xóa <strong>{deleteTarget.roomName}</strong>?</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Hủy</button>
                            <button className={styles.deleteBtn} onClick={confirmDelete}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {assignmentModalOpen && selectedRoom && (
                <div className={styles.overlay} onClick={closeAssignmentModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Phân công bác sĩ - {selectedRoom.roomName}</h2>
                            <button className={styles.closeBtn} onClick={closeAssignmentModal}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Chọn lịch ca</h3>
                                <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: 8 }}>
                                    {availableSchedulesLoading ? (
                                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)' }}>Đang tải lịch...</div>
                                    ) : availableSchedules.length === 0 ? (
                                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)' }}>Không có lịch khả dụng</div>
                                    ) : (
                                        availableSchedules.map(s => {
                                            const isSelected = selectedSchedule && selectedSchedule.scheduleId === s.scheduleId;
                                            return (
                                                <button key={s.scheduleId} type="button" onClick={() => setSelectedSchedule(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, marginBottom: 8, borderRadius: 6, border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: isSelected ? 'rgba(13,110,253,0.06)' : 'transparent' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.doctorName}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.specialtyName || ''}</div>
                                                    <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.workDate}</div>
                                                        <div style={{ fontWeight: 600 }}>{(s.shiftStart || '').slice(0, 5)} - {(s.shiftEnd || '').slice(0, 5)}</div>
                                                        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.maxPatients} bệnh nhân</div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" className={styles.submitBtn} disabled={assignmentSaving || !selectedSchedule} onClick={async (e) => {
                                        e.preventDefault();
                                        if (!selectedSchedule || !selectedRoom) return;
                                        // client-side check for room overlap
                                        const newStart = parseTimeToMinutes((selectedSchedule.shiftStart || '').slice(0, 5));
                                        const newEnd = parseTimeToMinutes((selectedSchedule.shiftEnd || '').slice(0, 5));
                                        const overlap = (roomAssignments || []).some(schedule => {
                                            if (!schedule || schedule.workDate !== selectedSchedule.workDate) return false;
                                            const es = parseTimeToMinutes((schedule.shiftStart || '').slice(0, 5));
                                            const ee = parseTimeToMinutes((schedule.shiftEnd || '').slice(0, 5));
                                            return newStart < ee && newEnd > es;
                                        });
                                        if (overlap) {
                                            showToast('Phòng đã có lịch trùng ca trong thời gian này.', 'error');
                                            return;
                                        }
                                        setAssignmentSaving(true);
                                        try {
                                            const res = await fetchWithAuth(`/api/admin/doctor-schedules/${selectedSchedule.scheduleId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ roomId: selectedRoom.roomId }),
                                            });
                                            if (!res.ok) {
                                                const err = await res.json().catch(() => null);
                                                throw new Error(err?.message || 'Có lỗi khi phân công');
                                            }
                                            showToast('Phân công bác sĩ thành công', 'success');
                                            // refresh
                                            setSelectedSchedule(null);
                                            fetchAvailableSchedules();
                                            fetchRoomAssignments(selectedRoom.roomId);
                                        } catch (err) {
                                            showToast(err.message || 'Có lỗi xảy ra', 'error');
                                        } finally {
                                            setAssignmentSaving(false);
                                        }
                                    }}>{assignmentSaving ? 'Đang lưu...' : 'Gán vào phòng'}</button>
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setSelectedSchedule(null); }}>{'Bỏ chọn'}</button>
                                </div>

                                {/* Compact assigned list with edit/delete */}
                                <div style={{ marginTop: 12 }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Phân công hiện tại</h3>
                                    <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: 8 }}>
                                        {assignmentsLoading ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)' }}>Đang tải...</div>
                                        ) : roomAssignments.length === 0 ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)' }}>Chưa có phân công</div>
                                        ) : (
                                            roomAssignments.map(a => (
                                                <div key={a.scheduleId} style={{ padding: 10, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600 }}>{a.doctorName}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.workDate} | {(a.shiftStart || '').slice(0, 5)} - {(a.shiftEnd || '').slice(0, 5)}</div>
                                                    </div>
                                                    {editingAssignmentId === a.scheduleId ? (
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <input type="number" min="1" value={editingAssignmentMaxPatients} onChange={(e) => setEditingAssignmentMaxPatients(e.target.value)} className={styles.formInput} style={{ width: 100 }} />
                                                            <button className={styles.submitBtn} onClick={async () => {
                                                                const max = Number(editingAssignmentMaxPatients || 20);
                                                                if (!Number.isInteger(max) || max < 1) { showToast('Số bệnh nhân không hợp lệ', 'error'); return; }
                                                                try {
                                                                    const res = await fetchWithAuth(`/api/admin/doctor-schedules/${a.scheduleId}`, {
                                                                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxPatients: max })
                                                                    });
                                                                    if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || 'Không thể cập nhật'); }
                                                                    showToast('Cập nhật thành công', 'success');
                                                                    setEditingAssignmentId(null); setEditingAssignmentMaxPatients(''); fetchRoomAssignments(selectedRoom.roomId);
                                                                } catch (err) { showToast(err.message || 'Có lỗi', 'error'); }
                                                            }}>Lưu</button>
                                                            <button className={styles.cancelBtn} onClick={() => { setEditingAssignmentId(null); setEditingAssignmentMaxPatients(''); }}>Hủy</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.bookedCount ?? 0} / {a.maxPatients ?? '--'}</div>
                                                            <button className={styles.iconBtn} title="Sửa" onClick={() => { setEditingAssignmentId(a.scheduleId); setEditingAssignmentMaxPatients(a.maxPatients ?? 20); }}><Edit2 size={14} /></button>
                                                            <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Gỡ phân công" onClick={() => setDeleteAssignment(a)}><Trash2 size={14} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteAssignment && (
                <div className={styles.confirmOverlay} onClick={() => setDeleteAssignment(null)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}><Calendar size={24} /></div>
                        <h3 className={styles.confirmTitle}>Gỡ phân công</h3>
                        <p className={styles.confirmText}>Gỡ phân công <strong>{deleteAssignment.doctorName}</strong> vào ngày <strong>{deleteAssignment.workDate}</strong>?</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteAssignment(null)}>Hủy</button>
                            <button className={styles.deleteBtn} onClick={confirmDeleteAssignment}>Gỡ phân công</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
