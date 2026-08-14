import React from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedField from '../admin/LocalizedField';
import FileUpload from '../common/FileUpload';
import ImageFocusPicker from '../common/ImageFocusPicker';
import SkillsInput from './SkillsInput';
import { TeamProfileFormState } from '../../types/team';

interface TeamProfileFieldsProps<T extends TeamProfileFormState> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Jamoa profilining umumiy qismi — admin paneli (AdminTeamPage) va xodimning
 * shaxsiy kabineti (TeamProfilePage) aynan shu maydonlarni ko'rsatadi.
 * Ikkalasida ikki nusxa forma saqlanmasligi uchun ajratilgan.
 */
export default function TeamProfileFields<T extends TeamProfileFormState>({
  form,
  setForm,
}: TeamProfileFieldsProps<T>): React.ReactElement {
  const { t } = useTranslation();

  const change = (field: keyof TeamProfileFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  return (
    <>
      <div className="form-row">
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.name')} *
          </label>
          <input className="inp" value={form.name} onChange={change('name')} required minLength={2} />
        </div>
        <LocalizedField label={t('team.form.position')} required value={form.position}
          onChange={(next) => setForm((f) => ({ ...f, position: next }))}
          placeholder={t('team.form.positionPlaceholder')} />
      </div>

      <LocalizedField label={t('team.form.bio')} required multiline rows={4} value={form.bio}
        onChange={(next) => setForm((f) => ({ ...f, bio: next }))} />

      <FileUpload kind="image" label={t('team.form.photo')} value={form.photoUrl}
        onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))} />

      <ImageFocusPicker url={form.photoUrl} focusX={form.focusX} focusY={form.focusY}
        onChange={(focusX, focusY) => setForm((f) => ({ ...f, focusX, focusY }))} />

      <SkillsInput label={t('team.form.skills')} value={form.skills}
        onChange={(next) => setForm((f) => ({ ...f, skills: next }))} />

      <div className="form-row">
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.email')}
          </label>
          <input className="inp" type="email" value={form.email} onChange={change('email')} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.phone')}
          </label>
          <input className="inp" value={form.phone} onChange={change('phone')} />
        </div>
      </div>

      <div className="form-row-4">
        {(['linkedinUrl', 'githubUrl', 'telegramUrl', 'websiteUrl'] as const).map((key) => (
          <div key={key}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              {t(`team.form.${key}`)}
            </label>
            <input className="inp" value={form[key]} onChange={change(key)} />
          </div>
        ))}
      </div>

    </>
  );
}
