import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMentorCourse } from '../../api/mentors';
import CurriculumEditor from '../../components/curriculum/CurriculumEditor';

// Mentor o'z kursining dasturini (modul/darslarini) tahrirlaydi
export default function MentorCurriculumPage(): React.ReactElement {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  return (
    <CurriculumEditor courseId={id!} backTo="/mentor/courses" backLabel={t('mentor.nav.courses')}
      loadCourse={getMentorCourse} />
  );
}
