import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendQuoteEmail(params: {
  to: string
  clientName: string
  artisanName: string
  quoteAmount: number
  pdfBuffer: Buffer
  quoteId: string
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Votre devis de ${params.artisanName} — ${params.quoteAmount.toLocaleString('fr-FR')} €`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔨 ArtisanBot</h1>
        </div>
        <div style="padding: 32px;">
          <p>Bonjour ${params.clientName},</p>
          <p>Veuillez trouver ci-joint votre devis de <strong>${params.artisanName}</strong> d'un montant de <strong>${params.quoteAmount.toLocaleString('fr-FR')} €</strong>.</p>
          <p>N'hésitez pas à nous contacter pour toute question.</p>
          <p>Cordialement,<br/><strong>${params.artisanName}</strong></p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `devis-${params.quoteId}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  })
}

export async function sendInvoiceEmail(params: {
  to: string
  clientName: string
  artisanName: string
  invoiceAmount: number
  dueDate: string
  pdfBuffer: Buffer
  invoiceId: string
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Votre facture de ${params.artisanName} — à régler avant le ${params.dueDate}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔨 ArtisanBot</h1>
        </div>
        <div style="padding: 32px;">
          <p>Bonjour ${params.clientName},</p>
          <p>Veuillez trouver ci-joint votre facture de <strong>${params.artisanName}</strong> d'un montant de <strong>${params.invoiceAmount.toLocaleString('fr-FR')} €</strong>.</p>
          <p>Date d'échéance : <strong>${params.dueDate}</strong></p>
          <p>Cordialement,<br/><strong>${params.artisanName}</strong></p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `facture-${params.invoiceId}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  })
}

export async function sendReminderEmail(params: {
  to: string
  clientName: string
  artisanName: string
  invoiceAmount: number
  dueDate: string
  invoiceId: string
  daysPastDue: number
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Rappel de paiement — Facture ${params.artisanName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: #F59E0B; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Rappel de paiement</h1>
        </div>
        <div style="padding: 32px;">
          <p>Bonjour ${params.clientName},</p>
          <p>Sauf erreur de notre part, la facture suivante est toujours en attente de règlement :</p>
          <ul>
            <li>Montant : <strong>${params.invoiceAmount.toLocaleString('fr-FR')} €</strong></li>
            <li>Date d'échéance : <strong>${params.dueDate}</strong> (${params.daysPastDue} jour(s) de retard)</li>
          </ul>
          <p>Merci de régulariser cette situation dès que possible.</p>
          <p>Cordialement,<br/><strong>${params.artisanName}</strong></p>
        </div>
      </div>
    `,
  })
}

export async function sendNewLeadNotification(params: {
  to: string
  artisanName: string
  clientDescription: string
  source: 'widget' | 'form'
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Nouvelle demande de devis — ArtisanBot`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: #10B981; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🎉 Nouvelle demande !</h1>
        </div>
        <div style="padding: 32px;">
          <p>Bonjour ${params.artisanName},</p>
          <p>Un client vient de vous envoyer une demande via ${params.source === 'widget' ? 'votre chatbot' : 'votre formulaire public'} :</p>
          <blockquote style="border-left: 4px solid #2563EB; padding-left: 16px; color: #6B7280;">
            ${params.clientDescription}
          </blockquote>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Voir dans le dashboard →</a></p>
        </div>
      </div>
    `,
  })
}
