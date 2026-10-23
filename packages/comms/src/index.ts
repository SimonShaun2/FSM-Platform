export type {
  OutboundChannelKind,
  OutboundEmailChannel,
  OutboundEmailPayload,
  OutboundMessageTemplateRef,
  OutboundSmsChannel,
  OutboundSmsPayload
} from "./channels.js";
export { createResendEmailChannel, type ResendEmailAdapterConfig } from "./resend-email.adapter.js";
export { createDisabledSmsChannel, sendSmsDisabled } from "./sms-disabled.stub.js";
export {
  EMAIL_TEMPLATE_IDS,
  renderTransactionalEmail,
  resolveOutboundEmailFromAddress,
  type EmailTemplateId,
  type RenderedTransactionalEmail
} from "./email-templates.js";
export {
  isMvpResendTransactionalTemplate,
  MVP_RESEND_TRANSACTIONAL_TEMPLATE_IDS,
  resendTagsForTransactionalTemplate,
  type MvpResendTransactionalTemplateId
} from "./transactional-template-catalog.js";
