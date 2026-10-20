import React from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  title?: string;
  message?: string;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  onConfirm,
  onDecline,
  title = 'Age Verification Required (18+)',
  message = 'This section contains mature anime content rated TV-MA and R-17+ (including intense action, psychological horror, and mature themes). You must be 18 years of age or older to enter.',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 13, 0.90)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="nm-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'linear-gradient(145deg, #181b2e 0%, #111424 100%)',
          borderRadius: '24px',
          padding: '36px 30px',
          textAlign: 'center',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(225, 29, 72, 0.25)',
          position: 'relative'
        }}
      >
        {/* Top Warning Icon Badge */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(225, 29, 72, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <ShieldAlert size={36} color="#fff" />
        </div>

        {/* 18+ Pill */}
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(225, 29, 72, 0.15)',
            color: '#fb7185',
            border: '1px solid rgba(225, 29, 72, 0.4)',
            borderRadius: '9999px',
            padding: '4px 14px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}
        >
          Mature Content Gate
        </span>

        {/* Title */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            marginBottom: '12px'
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: '1.6',
            marginBottom: '28px',
            padding: '0 8px'
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(225, 29, 72, 0.45)'
            }}
          >
            <CheckCircle size={18} />
            <span>Yes, I am 18 or older</span>
          </button>

          <button
            onClick={onDecline}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontSize: '14px',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <XCircle size={18} />
            <span>No, I am under 18 (Take me back)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
