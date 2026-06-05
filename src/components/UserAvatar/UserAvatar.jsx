import { getAvatarBg } from '../../utils/avatares';
import './UserAvatar.scss';

export default function UserAvatar({ avatar, size = 'md' }) {
  const bg = getAvatarBg(avatar);
  return (
    <div className={`user-avatar user-avatar--${size}`} style={{ background: bg }}>
      {avatar ?? '?'}
    </div>
  );
}
