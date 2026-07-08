import { useParams } from 'react-router-dom';
import { getCourseByIdAdmin } from '../../api/courses';
import CurriculumEditor from '../../components/curriculum/CurriculumEditor';

export default function AdminCurriculumPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  return (
    <CurriculumEditor courseId={id!} backTo="/admin/courses" backLabel="Kurslar ro'yxati"
      loadCourse={getCourseByIdAdmin} />
  );
}
