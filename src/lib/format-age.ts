export function formatAge(birthday: Date) {
  const today = new Date()
  let years = today.getFullYear() - birthday.getFullYear()
  let months = today.getMonth() - birthday.getMonth()

  if (today.getDate() < birthday.getDate()) months--
  if (months < 0) {
    years--
    months += 12
  }

  if (years === 0) return `${months}mo`
  if (months === 0) return `${years}y`
  return `${years}y ${months}mo`
}