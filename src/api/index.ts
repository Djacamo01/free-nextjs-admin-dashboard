export {
  bootstrapAuth,
  clearAuthSession,
  ensureFreshAccessToken,
  login,
  refreshSession,
  register,
  AuthHttpError,
} from "./auth";
export { apiFetch, apiJson, ApiHttpError as ClientHttpError } from "./client";
export {
  getApiBaseUrl,
  getAppBaseUrl,
  getAppApiKey,
  getChatWebhookChatUrl,
  getChatWebhookFetchTimeoutMs,
  getPublicAuthHeaders,
} from "./env";
export {
  ChatWebhookError,
  chatWebhookHasUsableContent,
  normalizeChatWebhookPayload,
  postChatMessage,
} from "./chat-webhook";
export type {
  ChatWebhookAttachment,
  ChatWebhookResponse,
  ChatWebhookSuggestion,
  PostChatMessageBody,
} from "./chat-webhook";
export {
  decodeJwtPayload,
  getAccessTokenExpiryMs,
  isAccessTokenExpired,
  accessTokenExpiresWithin,
} from "./jwt";
export type { JwtPayload } from "./jwt";
export {
  getAccessToken,
  getRefreshToken,
  isPersistentAuth,
} from "./token-storage";
export type {
  ApiRequestInit,
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from "./types";
export {
  fetchCurrentUser,
  fetchUsers,
  invalidateCurrentUserCache,
} from "./user";
export type { CurrentUser } from "./user";
export { createProvider, fetchProviderDetails, fetchProviders } from "./providers";
export type {
  CreateProviderRequest,
  Provider,
  ProviderDetails,
  ProviderEmailAddress,
  ProviderPhoneNumber,
  ProviderProfileDetails,
} from "./providers";
export {
  createPatient,
  fetchPatientDetails,
  fetchPatients,
} from "./patients";
export type {
  CreatePatientRequest,
  Patient,
  PatientChannelIdentity,
  PatientDetails,
  PatientEmailAddress,
  PatientPhoneNumber,
  PatientProfile,
} from "./patients";
export { createService, fetchServices } from "./services";
export type { CreateServiceRequest, Service } from "./services";
export {
  appointmentBelongsToPatient,
  appointmentBelongsToProvider,
  createAppointment,
  fetchAppointmentDetails,
  fetchAppointments,
  fetchAppointmentsForPatient,
  fetchAppointmentsForProvider,
  fetchAppointmentsGrouped,
  updateAppointment,
} from "./appointments";
export type {
  Appointment,
  AppointmentDetails,
  AppointmentEventItem,
  AppointmentGroup,
  AppointmentsGroupedResult,
  AppointmentsGroupByParam,
  CreateAppointmentRequest,
  FetchAppointmentsGroupedQuery,
  UpdateAppointmentRequest,
} from "./appointments";
export { fetchDashboardReport } from "./reporting";
export type {
  DashboardAppointmentsSummary,
  DashboardCounts,
  DashboardDayCount,
  DashboardReport,
  DashboardStatusRow,
  DashboardTopService,
} from "./reporting";
