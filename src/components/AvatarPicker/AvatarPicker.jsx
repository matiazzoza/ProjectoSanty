import { AVATARES_VECINO } from '../../utils/avatares';
import './AvatarPicker.scss';

export default function AvatarPicker({ value, onChange, set }) {
  const lista = set ?? AVATARES_VECINO;
  return (
    <div className="avatar-picker">
      {lista.map((av) => (
        <button
          key={av.emoji}
          type="button"
          className={`avatar-picker__item ${value === av.emoji ? 'avatar-picker__item--selected' : ''}`}
          style={{ background: av.bg }}
          onClick={() => onChange(av.emoji)}
          title={av.emoji}
        >
          {av.emoji}
        </button>
      ))}
    </div>
  );
}
