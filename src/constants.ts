export const COLORS = {
  whatsappGreen: '#25D366',
  whatsappDarkGreen: '#075E54',
  whatsappLightGreen: '#DCF8C6',
  whatsappBlue: '#34B7F1',
  whatsappGray: '#ECE5DD',
  whatsappDarkGray: '#128C7E',
};

export const SUBSCRIPTION_PRICE_CFA = 500;

export const PREDEFINED_THEMES = [
  {
    id: 'default',
    name: 'WhatsApp Classic',
    primaryColor: '#25D366',
    secondaryColor: '#075E54',
    accentColor: '#DCF8C6',
    backgroundColor: '#ECE5DD',
    textColor: '#111b21'
  },
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    primaryColor: '#007bff',
    secondaryColor: '#0056b3',
    accentColor: '#e7f1ff',
    backgroundColor: '#f8f9fa',
    textColor: '#212529'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primaryColor: '#ff6b6b',
    secondaryColor: '#ee5253',
    accentColor: '#ffeaa7',
    backgroundColor: '#fdf0d5',
    textColor: '#2d3436'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primaryColor: '#2ecc71',
    secondaryColor: '#27ae60',
    accentColor: '#e8f8f5',
    backgroundColor: '#f4fbf9',
    textColor: '#1e272e'
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    primaryColor: '#8e44ad',
    secondaryColor: '#6c3483',
    accentColor: '#f4ecf7',
    backgroundColor: '#fdfaff',
    textColor: '#2c3e50'
  }
];

export const CHANGELOG = [
  {
    version: '2.4.0',
    date: '23 Mars 2026',
    title: 'Mise à jour des données et Synchronisation',
    type: 'minor',
    changes: [
      'Ajout d\'un bouton de rafraîchissement manuel des données.',
      'Mise à jour de la structure de la base de données (Blueprint).',
      'Affichage de la version et de l\'heure de mise à jour dans les paramètres.',
      'Optimisation des performances de chargement.'
    ]
  },
  {
    version: '2.3.0',
    date: '23 Mars 2026',
    title: 'Codes QR et Installation PWA',
    type: 'minor',
    changes: [
      'Ajout de la fonctionnalité de scan de code QR pour ajouter des contacts.',
      'Génération de code QR personnel avec photo de profil.',
      'Bannière de suggestion d\'installation de l\'application sur l\'écran d\'accueil.',
      'Bouton d\'installation directe dans les paramètres.'
    ]
  },
  {
    version: '2.2.0',
    date: '23 Mars 2026',
    title: 'Thèmes Personnalisés',
    type: 'minor',
    changes: [
      'Introduction des thèmes prédéfinis (WhatsApp Classic, Deep Blue, etc.).',
      'Possibilité de créer des thèmes personnalisés avec sélecteurs de couleurs.',
      'Synchronisation du thème sur le cloud via le profil utilisateur.'
    ]
  }
];
