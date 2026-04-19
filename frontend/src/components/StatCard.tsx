import React from 'react';
interface StatCardProps { icon: React.ReactNode; label: string; value: number; color: string; }
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);
export default StatCard;
