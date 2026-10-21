import { FileQuestion, Info } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { previewKind, officeViewerUrl } from '../lib/utils';

export function FilePreview({ url, mime, name }) {
  const { t } = useI18n();
  if (!url) return null;
  const kind = previewKind(mime, name);

  if (kind === 'image') return <img className="preview-img" src={url} alt={name || ''} />;
  if (kind === 'video') return <video className="preview-video" src={url} controls preload="metadata" />;
  if (kind === 'audio') return <audio src={url} controls style={{ width: '100%' }} />;
  if (kind === 'pdf' || kind === 'text')
    return <iframe className="preview-frame" src={url} title={name || 'preview'} />;
  if (kind === 'office')
    return (
      <>
        <iframe className="preview-frame" src={officeViewerUrl(url)} title={name || 'preview'} />
        <p className="muted small preview-note">
          <Info size={14} /> {t('preview.officeNote')}
        </p>
      </>
    );
  return (
    <div className="preview-none">
      <FileQuestion size={32} />
      <p className="muted">{t('preview.unavailable')}</p>
    </div>
  );
}
