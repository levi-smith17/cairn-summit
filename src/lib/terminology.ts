export const CAIRN_TERMS = {
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
}

export const STANDARD_TERMS = {
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
}

export type Terms = typeof CAIRN_TERMS
export type TerminologyStyle = 'CAIRN' | 'STANDARD'

export function getTerms(style: TerminologyStyle): Terms {
  return style === 'CAIRN' ? CAIRN_TERMS : STANDARD_TERMS
}