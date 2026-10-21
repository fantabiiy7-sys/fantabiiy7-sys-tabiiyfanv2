import { Info, CheckCircle2, Mail, Phone, School } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useSetting } from '../context/SettingsContext';
import { PageHeader } from '../components/PageHeader';

export default function About() {
  const { t } = useI18n();
  const setting = useSetting();
  const email = setting('contactEmail');
  const phone = setting('contactPhone');
  const school = setting('schoolName');

  return (
    <div className="container page narrow">
      <PageHeader icon={Info} color="blue" title={t('about.title')} text={t('tagline')} />
      <div className="card prose">
        <p className="pre-wrap lead">{setting('aboutText', t('about.defaultText'))}</p>
        <h2 className="sub-title">{t('about.goalsTitle')}</h2>
        <ul className="check-list">
          {t('about.goals').map((g) => (
            <li key={g}>
              <CheckCircle2 size={18} className="text-green" /> {g}
            </li>
          ))}
        </ul>
        {(email || phone || school) && (
          <>
            <h2 className="sub-title">{t('about.contact')}</h2>
            <ul className="meta-list">
              {school && (
                <li>
                  <School size={16} /> <span>{school}</span>
                </li>
              )}
              {email && (
                <li>
                  <Mail size={16} /> <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              {phone && (
                <li>
                  <Phone size={16} /> <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
