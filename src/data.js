export const status = { illustrative: 'Illustrative', concept: 'Concept', verified: 'Verified source' };

export const places = [
  { id: 'city-palace', name: 'City Palace', category: 'Architecture', duration: '2–3 hours', image: '/img/places/city-palace.png', note: 'Museum visit; check current hours before travelling.', access: 'Step-free access is not independently verified in this demo.' },
  { id: 'pichola', name: 'Lake Pichola', category: 'Lakes', duration: '1–2 hours', image: '/img/places/lake-pichola.png', note: 'A lakeside pause and boat-viewing route.', access: 'Promenade conditions vary by ghat.' },
  { id: 'jagdish', name: 'Jagdish Temple', category: 'Architecture', duration: '45 minutes', image: '/img/places/jagdish-temple.png', note: 'A living temple in the old city.', access: 'Stairs are part of the approach.' },
  { id: 'bagore', name: 'Bagore Ki Haveli', category: 'Art', duration: '1–2 hours', image: '/img/places/bagore-ki-haveli.png', note: 'Museum and performance venue; confirm programme directly.', access: 'Access information is not independently verified.' },
  { id: 'fateh', name: 'Fateh Sagar', category: 'Lakes', duration: '1 hour', image: '/img/places/fateh-sagar.png', note: 'An evening promenade and lake view.', access: 'Flat stretches vary by route.' },
  { id: 'sajjangarh', name: 'Sajjangarh', category: 'Photography', duration: '2 hours', image: '/img/places/sajjangarh.png', note: 'Hilltop viewpoint; plan transport and weather carefully.', access: 'Hill approach; accessibility not verified.' },
];

export const stories = [
  { title: 'A city planned around water', place: 'City Palace', type: 'History', source: 'Illustrative synopsis; consult a museum or published history before relying on it.', status: 'Illustrative' },
  { title: 'The evening bell at the chowk', place: 'Jagdish Temple', type: 'Oral tradition', source: 'Illustrative demonstration of a locally transmitted story.', status: 'Illustrative' },
  { title: 'Monsoon light over the hills', place: 'Sajjangarh', type: 'Legend', source: 'Illustrative demonstration; not a documented historical claim.', status: 'Illustrative' },
];

export const artisans = [
  { id: 'meera-studio', name: 'Meera Studio', craft: 'Miniature painting', location: 'Old City', detail: 'Demonstration listing. Products and workshop details are illustrative.', image: '/img/street.webp' },
  { id: 'rang-resham', name: 'Rang & Resham', craft: 'Textiles', location: 'Hathi Pol area', detail: 'Demonstration listing. Enquiry does not contact a real studio.', image: '/img/palace.webp' },
  { id: 'kumbha-clay', name: 'Kumbha Clay', craft: 'Ceramics', location: 'Udaipur', detail: 'Demonstration listing. Availability is illustrative.', image: '/img/og.webp' },
];

export const events = [
  { title: 'Old-city sketch walk', kind: 'Heritage walk', date: 'Sample date', duration: '2 hours', language: 'English + Hindi', cost: 'Illustrative price', booking: 'Enquiry only' },
  { title: 'Miniature-painting introduction', kind: 'Workshop', date: 'Sample date', duration: '90 minutes', language: 'Hindi + English', cost: 'Illustrative price', booking: 'Enquiry only' },
  { title: 'Courtyard performance listing', kind: 'Performance', date: 'Sample date', duration: '1 hour', language: 'No language requirement', cost: 'Check organiser', booking: 'Direct organiser confirmation required' },
];

// Relationship-first demonstration records used by future route/detail views.
// Every non-documentary record remains explicitly illustrative.
export const products = [{ id: 'mini-print', artisanId: 'meera-studio', title: 'Miniature study print', status: 'Illustrative', rights: 'Demo asset only' }];
export const services = [{ id: 'paint-session', artisanId: 'meera-studio', title: 'Studio conversation', status: 'Illustrative' }];
export const workshops = [{ id: 'painting-intro', artisanId: 'meera-studio', placeId: 'bagore', title: 'Miniature-painting introduction', duration: '90 minutes', language: 'Hindi + English', cost: 'Illustrative price', status: 'Illustrative', updated: '2026-10-30' }];
export const reviews = [{ id: 'tip-ghat', placeId: 'pichola', kind: 'Local tip', text: 'Illustrative tip: keep ghats clear and ask before photographing people.', status: 'Illustrative' }];
export const trails = [{ id: 'water-edge', title: 'Water’s edge', theme: 'Lakes', placeIds: ['pichola', 'fateh'], duration: '2 hours', status: 'Illustrative' }];
export const itineraries = [{ id: 'old-city-day', title: 'Old city day', placeIds: ['city-palace', 'jagdish', 'bagore'], duration: 'One day', status: 'Illustrative' }];
export const audioWalks = [{ id: 'old-city-listen', title: 'Old city listening walk', placeIds: ['jagdish', 'bagore'], chapters: 2, language: 'English + Hindi', status: 'Concept' }];
export const memories = [{ id: 'sunset-note', placeId: 'pichola', storyId: null, caption: 'A sample local-only moment', status: 'Illustrative' }];
export const badges = [{ id: 'curious-visitor', title: 'Curious visitor', description: 'A local demonstration badge, never proof of a visit.', status: 'Illustrative' }];
export const markets = [{ id: 'hathi-pol', title: 'Hathi Pol area', categories: ['Textiles', 'Paintings'], status: 'Unverified', note: 'Confirm individual sellers and hours directly.' }];
export const hiddenPlaces = [{ id: 'quiet-ghat', title: 'Quieter lakeside pause', sensitivity: 'Do not treat as a secret site; respect residents and local access.', status: 'Illustrative' }];
