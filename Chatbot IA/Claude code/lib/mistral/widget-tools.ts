import type { MistralTool } from './client'

export const widgetTools: MistralTool[] = [
  {
    type: 'function',
    function: {
      name: 'save_client_info',
      description: 'Sauvegarde les coordonnées du client (nom, email, téléphone) collectées durant la conversation.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nom complet du client' },
          email: { type: 'string', description: 'Adresse email du client' },
          phone: { type: 'string', description: 'Numéro de téléphone du client' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_quote_draft',
      description: 'Crée un brouillon de devis quand toutes les informations nécessaires ont été collectées.',
      parameters: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string', description: 'ID de la conversation' },
          description: { type: 'string', description: 'Description complète des travaux' },
          estimated_amount: { type: 'number', description: 'Montant estimé en euros (si possible)' },
          lines: {
            type: 'array',
            description: 'Lignes du devis',
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
        required: ['conversation_id', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_conversation_qualified',
      description: 'Marque la conversation comme qualifiée quand toutes les informations ont été collectées.',
      parameters: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string', description: 'ID de la conversation' },
          summary: { type: 'string', description: 'Résumé de la demande du client' },
        },
        required: ['conversation_id', 'summary'],
      },
    },
  },
]
