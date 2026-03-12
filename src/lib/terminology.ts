export const CAIRN_TERMS = {
  outpost: 'The Outpost',
  basecamp: 'Basecamp',
  signals: 'Signals',
  waypoints: 'Waypoints',
  logs: 'Logs',
  provisions: 'Provisions',
  trails: 'Trails',
  markers: 'Markers',
  manifest: 'Manifest',
  origins: 'Origins',
  expeditions: 'Expeditions',
  training: 'Training',
  gear: 'Gear',
  landmarks: 'Landmarks',
  summits: 'Summits',
  pathfinding: 'Pathfinding',
  summary: 'Summary',
  headline: 'Headline',
  location: 'Location',
  bio: 'Field Notes',
  bio_button: 'My Journey',
  companions: 'Companions',
  summit_reached: 'Summit Reached',
  explore: 'Explore',
}

export const STANDARD_TERMS = {
  outpost: 'Directory',
  basecamp: 'Dashboard',
  signals: 'Messages',
  waypoints: 'Bookmarks',
  logs: 'Notes',
  provisions: 'Finance',
  trails: 'Folders',
  markers: 'Tags',
  manifest: 'Resume',
  origins: 'About',
  expeditions: 'Work Experience',
  training: 'Education',
  gear: 'Skills',
  landmarks: 'Projects',
  summits: 'Achievements',
  pathfinding: 'Volunteering',
  summary: 'Summary',
  headline: 'Title',
  location: 'Location',
  bio: 'Bio',
  bio_button: 'More About Me',
  companions: 'Pets',
  summit_reached: 'In Memoriam',
  explore: 'Search',
}

export type Terms = typeof CAIRN_TERMS
export type TerminologyStyle = 'CAIRN' | 'STANDARD'

export function getTerms(style: TerminologyStyle): Terms {
  return style === 'CAIRN' ? CAIRN_TERMS : STANDARD_TERMS
}