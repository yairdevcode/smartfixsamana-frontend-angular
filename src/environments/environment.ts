// Configuración del entorno de desarrollo
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  // Session timeout configuration (in minutes)
  sessionTimeoutMinutes: 15,  // Total inactivity time before logout
  sessionWarningMinutes: 2    // Warning period before timeout
};