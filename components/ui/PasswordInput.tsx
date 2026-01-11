'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { CSSProperties, InputHTMLAttributes } from 'react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerStyle?: CSSProperties;
}

export function PasswordInput({ 
  label, 
  error, 
  style,
  containerStyle,
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.95rem 1.1rem',
    paddingRight: '3rem', // Make room for the eye icon
    borderRadius: '16px',
    border: `1px solid ${error ? '#ef4444' : isFocused ? '#3b82f6' : 'rgba(12, 34, 56, 0.15)'}`,
    fontSize: '1rem',
    backgroundColor: 'rgba(255,255,255,0.9)',
    outline: 'none',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
    ...style,
  };

  const toggleButtonStyle: CSSProperties = {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background-color 0.2s ease',
  };

  return (
    <div style={{ width: '100%', ...containerStyle }}>
      {label && (
        <div style={{ 
          display: 'grid',
          gap: '0.6rem',
          fontWeight: 600,
          color: '#0b1f33',
          marginBottom: '0.5rem',
        }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          style={inputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowPassword(!showPassword);
          }}
          style={toggleButtonStyle}
          tabIndex={-1} // Prevent tab focus on the toggle button
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>
      {error && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#ef4444',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
