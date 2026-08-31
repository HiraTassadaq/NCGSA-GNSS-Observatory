export default function StatCard({ label, value, unit, color = '#5ce1e6', detail }) 
{ return <article className="stat-card">
    <span>{label}</span>
    <strong style={{ color }}>
        {value}<em>{unit}</em></strong>
        {detail && <small>{detail}</small>}</article>; }
