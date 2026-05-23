/** Contraseña común para todas las cuentas de prueba */
export const DEMO_PASSWORD = 'demo123';

/**
 * 5 roles del sistema (backend: User.role enum).
 * Un usuario de referencia por rol — equipo URP + cuentas demo mod/admin.
 */
export const APP_ROLES = [
  { id: 'member', label: 'Miembro' },
  { id: 'creator', label: 'Creador' },
  { id: 'organizer', label: 'Organizador' },
  { id: 'moderator', label: 'Moderador' },
  { id: 'admin', label: 'Administrador' },
];

/** Cuentas mostradas en login (sin chips — solo referencia). */
export const TEST_LOGIN_ACCOUNTS = [
  {
    roleId: 'member',
    email: '202220906@urp.edu.pe',
    role: 'Miembro',
  },
  {
    roleId: 'moderator',
    email: 'moderador@eventus.app',
    role: 'Moderador',
  },
];

/** @deprecated Usar TEST_LOGIN_ACCOUNTS */
export const DEMO_ACCOUNTS = TEST_LOGIN_ACCOUNTS;
