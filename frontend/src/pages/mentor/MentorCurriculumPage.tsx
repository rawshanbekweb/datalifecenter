import { useParams } from 'react-router-dom';
import { getMentorCourse } from '../../api/mentors';
import CurriculumEditor from '../../components/curriculum/CurriculumEditor';

// Mentor o'z kursining dasturini (modul/darslarini) tahrirlaydi
export default function MentorCurriculumPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  return (
    <CurriculumEditor courseId={id!} backTo="/mentor/courses" backLabel="Kurslarim"
      loadCourse={getMentorCourse} />
  );
}
