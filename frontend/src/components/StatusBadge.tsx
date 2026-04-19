import React from 'react';

interface BadgeProps { status: string; }

const STATUS_CLASSES: Record<string, string> = {
  borrowed:    'badge-borrowed',
  returned:    'badge-returned',
  overdue:     'badge-overdue',
  available:   'badge-available',
  unavailable: 'badge-unavailable',
  pending:     'badge-pending',
  rejected:    'badge-rejected',
};

const StatusBadge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`badge ${STATUS_CLASSES[status] || 'badge-borrowed'}`}>{status}</span>
);

export default StatusBadge;
