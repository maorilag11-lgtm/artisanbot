-- Seed default trade templates
INSERT INTO trade_templates (trade, is_default, artisan_id, questions, system_prompt_extra)
VALUES
(
  'menuisier', true, null,
  '[
    {"key": "type_travaux", "label": "Type de travaux (meuble, escalier, aménagement, réparation…)", "required": true},
    {"key": "dimensions", "label": "Dimensions souhaitées (hauteur, largeur, profondeur)", "required": true},
    {"key": "type_bois", "label": "Type de bois préféré (chêne, hêtre, pin, noyer…)"},
    {"key": "finition", "label": "Finition souhaitée (brut, verni, huilé, peint…)"},
    {"key": "fixation", "label": "Mode de fixation (mural, sur pied, encastré…)"},
    {"key": "delai", "label": "Délai souhaité pour la réalisation"},
    {"key": "budget", "label": "Budget indicatif"}
  ]',
  'Tu es l''assistant virtuel d''un atelier de menuiserie-ébénisterie. Tu collectes les informations nécessaires pour établir un devis précis (dimensions exactes, type de bois, finition, fixation, délai). Pose les questions une par une de façon naturelle et conviviale.'
),
(
  'plombier', true, null,
  '[
    {"key": "type_intervention", "label": "Type d''intervention (fuite, installation, rénovation, débouchage…)", "required": true},
    {"key": "urgence", "label": "Niveau d''urgence (normal, urgent, très urgent)", "required": true},
    {"key": "localisation", "label": "Localisation dans le logement (cuisine, salle de bain, cave…)"},
    {"key": "acces_eau", "label": "Accès au point d''eau (robinet d''arrêt accessible ?)"},
    {"key": "type_logement", "label": "Type de logement (appartement, maison) et étage"},
    {"key": "ancien_ou_neuf", "label": "Installation ancienne ou récente"},
    {"key": "disponibilite", "label": "Vos disponibilités pour l''intervention"}
  ]',
  'Tu es l''assistant virtuel d''une entreprise de plomberie. En cas d''urgence (fuite active), propose immédiatement de couper l''eau. Sois rassurant et professionnel.'
),
(
  'electricien', true, null,
  '[
    {"key": "type_travaux", "label": "Type de travaux (mise aux normes, installation, dépannage, tableau…)", "required": true},
    {"key": "urgence", "label": "Niveau d''urgence", "required": true},
    {"key": "surface", "label": "Surface ou nombre de pièces concernées"},
    {"key": "type_logement", "label": "Type de logement et année de construction approximative"},
    {"key": "tableau_electrique", "label": "Age et type du tableau électrique"},
    {"key": "norme", "label": "Mise aux normes demandée (NF C 15-100) ?"},
    {"key": "disponibilite", "label": "Vos disponibilités"}
  ]',
  'Tu es l''assistant virtuel d''un électricien qualifié. En cas de danger immédiat (court-circuit, odeur de brûlé), demande immédiatement de couper le disjoncteur général.'
),
(
  'macon', true, null,
  '[
    {"key": "type_travaux", "label": "Type de travaux (fondations, mur, dalle, enduit, rénovation…)", "required": true},
    {"key": "surface", "label": "Surface ou dimensions approximatives", "required": true},
    {"key": "materiau", "label": "Matériaux souhaités (béton, parpaing, brique, pierre…)"},
    {"key": "permis", "label": "Permis de construire ou déclaration préalable nécessaire ?"},
    {"key": "accessibilite", "label": "Accessibilité du chantier (engin de chantier possible ?)"},
    {"key": "delai", "label": "Délai souhaité pour les travaux"},
    {"key": "budget", "label": "Budget indicatif"}
  ]',
  'Tu es l''assistant virtuel d''une entreprise de maçonnerie. Tu collectes les informations pour estimer les travaux : type, surface, matériaux, accessibilité, délai.'
),
(
  'peintre', true, null,
  '[
    {"key": "type_travaux", "label": "Type de travaux (intérieur, extérieur, ravalement, papier peint…)", "required": true},
    {"key": "surface", "label": "Surface à peindre (m²) ou pièces concernées", "required": true},
    {"key": "etat_support", "label": "État actuel des murs (bon état, fissures, ancien papier peint…)"},
    {"key": "couleurs", "label": "Couleurs ou teintes souhaitées"},
    {"key": "type_peinture", "label": "Type de peinture souhaitée (mate, satinée, lessivable…)"},
    {"key": "mobilier", "label": "Mobilier à protéger ou déplacer ?"},
    {"key": "delai", "label": "Délai souhaité"}
  ]',
  'Tu es l''assistant virtuel d''une entreprise de peinture en bâtiment. Tu collectes les informations pour établir un devis : surface, état des supports, couleurs, type de peinture, délai.'
),
(
  'autre', true, null,
  '[
    {"key": "description", "label": "Description des travaux souhaités", "required": true},
    {"key": "surface", "label": "Surface ou étendue des travaux"},
    {"key": "urgence", "label": "Niveau d''urgence"},
    {"key": "delai", "label": "Délai souhaité"},
    {"key": "budget", "label": "Budget indicatif"}
  ]',
  'Tu es l''assistant virtuel d''un artisan professionnel. Tu collectes les informations nécessaires pour établir un devis précis. Pose les questions une par une de façon naturelle et conviviale.'
);

-- Default automation settings trigger (optional, can be done via trigger)
-- INSERT INTO automation_settings (artisan_id, ...) is done via trigger on artisans insert
