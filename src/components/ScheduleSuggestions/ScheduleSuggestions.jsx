import React from 'react';
import { Check } from 'lucide-react';
import styles from '../../pages/Doctors/Doctors.module.css';

const ScheduleSuggestions = ({ suggestions = [], onSelect }) => {
    return (
        <div className={styles.suggestionsPanel}>
            <h4 className={styles.suggestionsTitle}>Gợi ý ca trống</h4>
            <div className={styles.suggestionsList}>
                {suggestions.length === 0 ? (
                    <div className={styles.suggestionEmpty}>Không có gợi ý</div>
                ) : (
                    suggestions.map((s) => (
                        <button
                            key={`${s.start}-${s.end}`}
                            className={`${styles.suggestionCard} ${s.available ? styles.suggestionAvailable : styles.suggestionUnavailable}`}
                            disabled={!s.available}
                            onClick={() => s.available && onSelect && onSelect(s)}
                            type="button"
                        >
                            <div className={styles.suggestionTime}>{s.start} - {s.end}</div>
                            {s.available && <Check size={16} />}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScheduleSuggestions;
