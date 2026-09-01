import biologyCover from '../assets/Bio.jpg';
import englishCover from '../assets/English.jpg';
import mathematicsCover from '../assets/maths.jpg';
import scienceCover from '../assets/default-image.jpeg';

export const getCourseCover = (courseName = '') => {
  const name = courseName.toLowerCase();
  if (/(math|algebra|geometry|statistics|calculus)/.test(name)) return mathematicsCover;
  if (/(biology|life science|ecology|cell)/.test(name)) return biologyCover;
  if (/(english|language|literature|reading|writing)/.test(name)) return englishCover;
  return scienceCover;
};
