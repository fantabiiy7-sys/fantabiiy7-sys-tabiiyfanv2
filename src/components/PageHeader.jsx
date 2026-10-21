export function PageHeader({ icon: Icon, color = 'blue', title, text, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {Icon && (
          <span className={`page-icon tone-${color}`}>
            <Icon size={26} />
          </span>
        )}
        <div>
          <h1>{title}</h1>
          {text && <p className="muted">{text}</p>}
        </div>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
