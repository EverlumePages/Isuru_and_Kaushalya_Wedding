export const wedding = {
  names: ['Isuru', 'Kaushalya'],
  initials: 'IK',
  date: { year: 2026, month: 8, day: 14 },
  timezone: 'Asia/Colombo',
  location: 'Colombo, Sri Lanka',
  // Local Sri Lankan venue time, from the ceremony to the afternoon farewell.
  start: '2026-08-14T09:00:00',
  end: '2026-08-14T15:00:00',
  whatsapp: '+94707001787',
  invitation: {
    greeting: 'Dear friends & family',
    message: 'ලස්සනම මතකයන් ඔබ සමඟ බෙදාගන්නයි මේ ආරාධනාව.',
    body: 'අපේ ජීවිතයේ මේ සුවිශේෂී දිනය ඔබ සමඟ සමරන්නට අපි ආදරයෙන් ඇරයුම් කරන්නෙමු. ආදරයත්, සිනහවත් පිරුණු දවසක් අප සමඟ ගත කරන්න එන්න.',
    closing: 'ඔබේ පැමිණීම අපට මහත් සතුටකි.',
  },
  // Sri Lankan venue details for the invitation.
  venues: [
    {
      kind: 'The ceremony',
      name: 'Cinnamon Lakeside Colombo',
      address: '115, Sir Chittampalam A. Gardiner Mawatha',
      city: 'Colombo 02, Sri Lanka',
      time: '09.00',
    },
  ],
  programme: [
    { time: '09.00', title: 'We say “I do”', detail: 'විවාහ උත්සවය', icon: 'rings' },
    { time: '10.30', title: 'A toast to love', detail: 'පිළිගැනීමේ සංග්‍රහය', icon: 'glasses' },
    { time: '12.30', title: 'Lunch & a little magic', detail: 'මංගල භෝජනය', icon: 'plate' },
    { time: '15.00', title: 'Until we meet again', detail: 'ආදරණීය සමුගැනීම', icon: 'stars' },
  ],
  palette: [
    { name: 'Charcoal', asset: 'swatch-charcoal' },
    { name: 'Forest', asset: 'swatch-forest' },
    { name: 'Olive', asset: 'swatch-olive' },
    { name: 'Deep teal', asset: 'swatch-teal' },
    { name: 'Chocolate', asset: 'swatch-chocolate' },
    { name: 'Taupe', asset: 'swatch-taupe' },
    { name: 'Champagne', asset: 'swatch-champagne' },
  ],
  wishes: 'ඔබේ පැමිණීම අපට ලැබෙන වටිනාම තෑග්ගයි.',
} as const;
