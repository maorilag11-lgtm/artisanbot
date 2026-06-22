import type { MistralTool } from './client'

export const assistantTools: MistralTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_pending_quote_requests',
      description: 'Liste les demandes de devis du formulaire public non encore traitées.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_active_conversations',
      description: 'Liste les conversations widget en cours.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_quote',
      description: 'Crée un nouveau devis pour un client.',
      parameters: {
        type: 'object',
        properties: {
          client_name: { type: 'string', description: 'Nom du client' },
          client_email: { type: 'string', description: 'Email du client' },
          amount: { type: 'number', description: 'Montant total du devis en euros' },
          description: { type: 'string', description: 'Description des travaux' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' },
              },
            },
          },
        },
        required: ['client_name', 'amount', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_quote',
      description: 'Envoie un devis par email au client (PDF en pièce jointe).',
      parameters: {
        type: 'object',
        properties: {
          quote_id: { type: 'string', description: 'ID du devis à envoyer' },
        },
        required: ['quote_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_planning',
      description: 'Récupère les rendez-vous du planning Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          date_from: { type: 'string', description: 'Date de début (ISO 8601, ex: 2025-01-15)' },
          date_to: { type: 'string', description: 'Date de fin (ISO 8601)' },
        },
        required: ['date_from'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Crée un rendez-vous dans le planning Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          client_name: { type: 'string', description: 'Nom du client' },
          title: { type: 'string', description: 'Titre du rendez-vous' },
          start_time: { type: 'string', description: 'Date et heure de début (ISO 8601)' },
          end_time: { type: 'string', description: 'Date et heure de fin (ISO 8601)' },
        },
        required: ['title', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Génère une facture depuis un devis accepté.',
      parameters: {
        type: 'object',
        properties: {
          quote_id: { type: 'string', description: 'ID du devis accepté' },
          due_date: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD)' },
        },
        required: ['quote_id', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'Envoie une facture par email au client.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'ID de la facture à envoyer' },
        },
        required: ['invoice_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_overdue_invoices',
      description: 'Liste les factures en retard de paiement.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder',
      description: 'Envoie une relance de paiement pour une facture impayée.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'ID de la facture à relancer' },
        },
        required: ['invoice_id'],
      },
    },
  },
]
