let pending = null;

export const setPendingNav   = (data) => { pending = data; };
export const getPendingNav   = ()     => pending;
export const clearPendingNav = ()     => { pending = null; };
