// Media and rights register. Every image the site shows is listed here with
// who made it and what it may be used for. "Public" does not mean "reusable".

const PROJECT = 'MIRAS project artwork (creator to be confirmed by the MIRAS team)';
const PROJECT_LICENCE = 'Not recorded in the repository';
const GENERATED_NOTE =
  'Found in public/img/places with no creator, source or licence on record. It looks computer-generated, so it is shown only as a labelled illustration in the VR gallery, never as a photograph, and never as the image of a specific place (at least one file name does not match what it shows).';

const APP_NOTE =
  'Copied from the MIRAS app (public/media/pichhola). Supplied as a background sheet; the creator and rights are not recorded, and the images look computer-generated. Shown only with the label "Illustrative image, not a photograph". Small files, so they look soft when enlarged.';

/** Images shared with the MIRAS app, listed as [file name, width, height, alt text]. @param {[string, number, number, string][]} rows */
const appImages = (rows) =>
  Object.fromEntries(rows.map(([name, width, height, alt]) => [`app-${name}`, /** @type {import('./types.js').MediaItem} */ ({
    id: `app-${name}`, src: `/img/app/${name}.webp`, width, height, alt,
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: APP_NOTE,
  })]));

const SCREEN_NOTE =
  'Screenshot of the MIRAS app running in demo mode (public/img/app-screens, taken 2026-10-31). The app shows sample content and illustrative images, and says so on screen.';

/** Screenshots of the MIRAS app, listed as [file name, alt text]. @param {[string, string][]} rows */
const appScreens = (rows) =>
  Object.fromEntries(rows.map(([name, alt]) => [`screen-${name}`, /** @type {import('./types.js').MediaItem} */ ({
    id: `screen-${name}`, src: `/img/app-screens/${name}.jpg`, width: 780, height: 1688, alt,
    kind: 'app-screenshot', label: 'App screenshot, sample content', creator: 'Team Impala',
    licence: 'Own work. The pictures inside it are illustrative with unknown rights.',
    permittedUse: 'MIRAS website, to show what the app looks like', notes: SCREEN_NOTE,
  })]));

/** @type {Record<string, import('./types.js').MediaItem>} */
export const media = {
  'hero-street': {
    id: 'hero-street', src: '/hero/original@2k.webp', width: 1920, height: 1080,
    alt: 'Ink drawing of a busy old-city street in Udaipur, with the City Palace on the hill behind',
    kind: 'ink-illustration', label: 'Illustration', creator: PROJECT, licence: PROJECT_LICENCE,
    permittedUse: 'MIRAS website only', notes: 'The homepage hero artwork.',
  },
  'ink-palace': {
    id: 'ink-palace', src: '/img/palace.webp', width: 1200, height: 740,
    alt: 'Ink drawing of the City Palace rising above old-city rooftops and street signs',
    kind: 'ink-illustration', label: 'Illustration', creator: PROJECT, licence: PROJECT_LICENCE,
    permittedUse: 'MIRAS website only', notes: 'Crop of the hero artwork.',
  },
  'ink-street': {
    id: 'ink-street', src: '/img/street.webp', width: 1520, height: 580,
    alt: 'Ink drawing of people crossing a street: two women walking, a woman in a sari, a man with a backpack and a cyclist',
    kind: 'ink-illustration', label: 'Illustration', creator: PROJECT, licence: PROJECT_LICENCE,
    permittedUse: 'MIRAS website only', notes: 'Crop of the hero artwork. Figures are drawn, not real people.',
  },
  'ink-lake': {
    id: 'ink-lake', src: '/img/lake-band.webp', width: 2400, height: 94,
    alt: 'Ink drawing of small covered boats on a lake',
    kind: 'ink-illustration', label: 'Illustration', creator: PROJECT, licence: PROJECT_LICENCE,
    permittedUse: 'MIRAS website only', notes: 'Strip from the bottom of the hero artwork.',
  },
  'ink-wide': {
    id: 'ink-wide', src: '/img/og.webp', width: 1200, height: 675,
    alt: 'Ink drawing of the full old-city street scene with boats on the lake below',
    kind: 'ink-illustration', label: 'Illustration', creator: PROJECT, licence: PROJECT_LICENCE,
    permittedUse: 'MIRAS website and link previews', notes: 'Social preview image.',
  },
  'gen-city-palace': {
    id: 'gen-city-palace', src: '/img/places/city-palace.png', width: 1586, height: 992,
    alt: 'Illustrative image: a long white palace along a lake at golden hour, with a small boat',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  'gen-lake-pichola': {
    id: 'gen-lake-pichola', src: '/img/places/lake-pichola.webp', width: 1600, height: 1001,
    alt: 'Illustrative image: a lake at sunset with a white island palace and a covered boat',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  'gen-jagdish-temple': {
    id: 'gen-jagdish-temple', src: '/img/places/jagdish-temple.png', width: 1586, height: 992,
    alt: 'Illustrative image: a lake at sunset with an island palace and a covered boat (the file is named after Jagdish Temple but does not show it)',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  'gen-bagore-ki-haveli': {
    id: 'gen-bagore-ki-haveli', src: '/img/places/bagore-ki-haveli.png', width: 1586, height: 992,
    alt: 'Illustrative image: a lamp-lit palace courtyard at dusk',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  'gen-fateh-sagar': {
    id: 'gen-fateh-sagar', src: '/img/places/fateh-sagar.webp', width: 1600, height: 1001,
    alt: 'Illustrative image: a lake with a palm-covered island and hills behind',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  'gen-sajjangarh': {
    id: 'gen-sajjangarh', src: '/img/places/sajjangarh.png', width: 1586, height: 992,
    alt: 'Illustrative image: a palace on a forested hilltop above lakes at sunset',
    kind: 'generated-illustration', label: 'Illustrative image, not a photograph', creator: 'Unknown',
    licence: 'Unknown', permittedUse: 'Internal demonstration only until rights are confirmed', notes: GENERATED_NOTE,
  },
  ...appImages([
    ['palace', 358, 358, 'Illustrative image: a cream-coloured palace with domed turrets beside a lake under a blue sky'],
    ['palace-wide', 358, 358, 'Illustrative image: a wide view of a cream-coloured palace along a lake under a blue sky'],
    ['temple', 358, 358, 'Illustrative image: a tall carved stone temple spire above a flight of steps, with trees'],
    ['camera', 358, 358, 'Illustrative image: a carved stone temple spire seen through a carved stone arch'],
    ['garden', 358, 358, 'Illustrative image: a domed marble pavilion beside a lotus pool in a garden'],
    ['golden', 358, 358, 'Illustrative image: a palace along a lake under an orange sunset sky'],
    ['dawn', 358, 358, 'Illustrative image: a small boat on a lake in soft morning light, with a palace on the shore and hills behind'],
    ['moonlight', 358, 358, 'Illustrative image: a full moon over a lit palace beside a lake at night'],
    ['night', 358, 358, 'Illustrative image: a lit palace across a lake at blue dusk, with a small boat'],
    ['splash', 358, 358, 'Illustrative image: a sunset over a lake and palace, seen through a carved stone arch, with a boat'],
    ['story', 358, 358, 'Illustrative image: a palace and a covered boat on a lake at sunset, with mountains behind'],
    ['artisan', 358, 358, 'Illustrative image: a hand painting a miniature with a fine brush, beside small pots of paint'],
    ['artwork', 260, 165, 'Illustrative image: a detail of a miniature painting showing an elephant and figures'],
    ['artwork-detail', 160, 100, 'Illustrative image: a blurred close detail of a colourful miniature painting'],
  ]),
  ...appScreens([
    ['home', 'The MIRAS app home screen: a search box, quick links and a featured place'],
    ['explore', 'The MIRAS app Explore screen: a grid of features such as Places, Stories and Walking trails, with some marked Not planned yet or Concept'],
    ['place', 'The MIRAS app place guide for City Palace, marked Illustrative and Sample content, with Add to my day and Save buttons'],
    ['plan', 'The MIRAS app planner: a seven-day strip, a start time, walk or drive, and a list of places to choose from'],
    ['profile', 'The MIRAS app profile screen: saved places on this device, with Saved, Memories and Badges tabs'],
  ]),
};

/** 360 / VR scenes. None of these is a real 360 capture. */
/** @type {import('./types.js').Scene[]} */
export const scenes = [
  { id: 'scene-old-city', title: 'Old-city street, drawn', placeId: 'jagdish-temple', mediaId: 'hero-street', kind: 'Illustrative', note: 'A pannable ink drawing standing in for a 360 capture. No real capture exists yet.' },
  { id: 'scene-palace-hill', title: 'Palace above the rooftops', placeId: 'city-palace', mediaId: 'ink-palace', kind: 'Illustrative', note: 'Drawn view; proportions are artistic, not surveyed.' },
  { id: 'scene-pichola', title: 'Lake Pichola at dusk', placeId: 'lake-pichola', mediaId: 'gen-lake-pichola', kind: 'Illustrative', note: 'Illustrative image with unknown rights. Not a photograph.' },
  { id: 'scene-fateh', title: 'Fateh Sagar embankment', placeId: 'fateh-sagar', mediaId: 'gen-fateh-sagar', kind: 'Illustrative', note: 'Illustrative image with unknown rights. Not a photograph.' },
  { id: 'scene-courtyard', title: 'Haveli courtyard, as it may have looked', placeId: 'bagore-ki-haveli', mediaId: 'ink-wide', kind: 'Reconstructed', note: 'Placeholder for a future reconstruction. A reconstruction would be an interpretation, not a record, and would be reviewed by a historian before use.' },
];
