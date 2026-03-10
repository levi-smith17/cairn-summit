export const CAIRN_TERMS = {
  page: 'Manifest',
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
  about: 'My Journey',
  bio: 'Trail Notes',
  companions: 'Companions',
  summit_reached: 'Summit Reached',
}

export const STANDARD_TERMS = {
  page: 'Resume',
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
  about: 'More About Me',
  bio: 'Bio',
  companions: 'Pets',
  summit_reached: 'In Memoriam',
}

export type Terms = typeof CAIRN_TERMS
export type TerminologyStyle = 'CAIRN' | 'STANDARD'

export function getTerms(style: TerminologyStyle): Terms {
  return style === 'CAIRN' ? CAIRN_TERMS : STANDARD_TERMS
}