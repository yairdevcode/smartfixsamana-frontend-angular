// Configuración del entorno de producción
export const environment = {
  production: true,
  apiUrl: '/api',
  // Session timeout configuration (in minutes)
  sessionTimeoutMinutes: 15,  // Total inactivity time before logout
  sessionWarningMinutes: 2    // Warning period before timeout
};