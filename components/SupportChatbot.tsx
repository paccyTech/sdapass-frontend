'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { MessageCircle, X, Send, User, Ticket, Calendar, MapPin, Phone, Mail, Globe } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import type { MemberPassViewer, MemberPassDetails } from '@/lib/api';

interface SupportChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  memberProfile: MemberPassViewer | null;
  memberPass: MemberPassDetails | null;
}

type Language = 'en' | 'fr' | 'rw';

const translations = {
  en: {
    welcome: 'Hello! How can I help you today?',
    info: 'Here is your information:',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    church: 'Church',
    passStatus: 'Pass Status',
    lastAttendance: 'Last Attendance',
    askQuestion: 'Ask me a question about your account...',
    send: 'Send',
    close: 'Close',
    language: 'Language',
    helpDefault: "I'm here to help with your account information. Ask about your profile, pass, or attendance!",
    helpButtons: {
      accountInfo: 'Account Information',
      passStatus: 'Pass Status',
      attendance: 'Attendance History',
      help: 'Help',
    },
  },
  fr: {
    welcome: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    info: 'Voici vos informations :',
    name: 'Nom',
    phone: 'Téléphone',
    email: 'Email',
    church: 'Église',
    passStatus: 'Statut du Pass',
    lastAttendance: 'Dernière Participation',
    askQuestion: 'Posez-moi une question sur votre compte...',
    send: 'Envoyer',
    close: 'Fermer',
    language: 'Langue',
    helpDefault: "Je suis là pour vous aider avec vos informations de compte. Demandez-moi sur votre profil, passe ou présence !",
    helpButtons: {
      accountInfo: 'Informations du Compte',
      passStatus: 'Statut du Passe',
      attendance: 'Historique de Présence',
      help: 'Aide',
    },
  },
  rw: {
    welcome: 'Muraho! Ni guteza gute?',
    info: 'Aha ni amakuru yawe:',
    name: 'Izina',
    phone: 'Telefoni',
    email: 'Imeyili',
    church: 'Itorero',
    passStatus: 'Imiterere y\'Ikarita',
    lastAttendance: 'Imurikagurisha ya Nyuma',
    askQuestion: 'Mumbaze ikibazo ku bijyanye n\'umubare wanyu...',
    send: 'Ohereza',
    close: 'Gufunga',
    language: 'Ururimi',
    helpDefault: "Ndi hano kugufasha n'amakuru yawe y'umubare. Mumbaze ku bijyanye n'umwirondoro wawe, ikarita cyangwa imurikagurisha!",
    helpButtons: {
      accountInfo: 'Amakuru y\'Umubare',
      passStatus: 'Imiterere y\'Ikarita',
      attendance: 'Imurikagurisha',
      help: 'Ubufasha',
    },
  },
};

const chatContainer: CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  width: '380px',
  height: '500px',
  background: 'var(--surface-primary)',
  border: '1px solid var(--surface-border)',
  borderRadius: '20px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'chatSlideIn 0.3s ease-out',
};

const chatHeader: CSSProperties = {
  padding: '20px 24px',
  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
  color: 'white',
  borderTopLeftRadius: '20px',
  borderTopRightRadius: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
};

const chatBody: CSSProperties = {
  flex: 1,
  padding: '20px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  background: 'var(--surface-primary)',
};

const messageBubble: CSSProperties = {
  padding: '14px 18px',
  borderRadius: '18px',
  maxWidth: '75%',
  wordWrap: 'break-word',
  fontSize: '14px',
  lineHeight: '1.4',
  position: 'relative',
  animation: 'messageFadeIn 0.3s ease-out',
};

const userMessage: CSSProperties = {
  ...messageBubble,
  background: 'linear-gradient(135deg, #2563eb, rgba(37, 99, 235, 0.9))',
  color: 'white',
  alignSelf: 'flex-end',
  marginLeft: 'auto',
  borderBottomRightRadius: '4px',
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
};

const botMessage: CSSProperties = {
  ...messageBubble,
  background: 'var(--surface-soft)',
  color: 'var(--shell-foreground)',
  alignSelf: 'flex-start',
  borderBottomLeftRadius: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const chatFooter: CSSProperties = {
  padding: '20px 24px',
  borderTop: '1px solid var(--surface-border)',
  display: 'flex',
  gap: '12px',
  background: 'var(--surface-primary)',
  borderBottomLeftRadius: '20px',
  borderBottomRightRadius: '20px',
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  border: '1px solid var(--surface-border)',
  borderRadius: '24px',
  outline: 'none',
  fontSize: '14px',
  background: 'var(--surface-soft)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const buttonStyle: CSSProperties = {
  padding: '12px 16px',
  border: 'none',
  borderRadius: '24px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #2563eb, rgba(37, 99, 235, 0.9))',
  color: 'white',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
};

const quickButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '4px 8px',
  color: '#2563eb',
  textDecoration: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
};

const languageSelect: CSSProperties = {
  padding: '6px 10px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  fontSize: '12px',
  outline: 'none',
};

const closeButton: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.2)',
  border: 'none',
  borderRadius: '8px',
  padding: '6px',
  cursor: 'pointer',
  color: 'white',
  transition: 'background 0.2s ease',
};

// Simple language detection based on keywords
const detectLanguage = (text: string): Language => {
  const lowerText = text.toLowerCase();
  
  // Kinyarwanda keywords
  const kinyarwandaWords = ['amakuru', 'muraho', 'gut', 'kubaza', 'umubare', 'itorero', 'imurikagurisha'];
  if (kinyarwandaWords.some(word => lowerText.includes(word))) {
    return 'rw';
  }
  
  // French keywords
  const frenchWords = ['bonjour', 'comment', 'vous', 'aider', 'informations', 'nom', 'téléphone', 'email', 'église'];
  if (frenchWords.some(word => lowerText.includes(word))) {
    return 'fr';
  }
  
  // Default to English
  return 'en';
};

export function SupportChatbot({ isOpen, onClose, user, memberProfile, memberPass }: SupportChatbotProps) {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ text: t.welcome, isUser: false }]);
    }
  }, [isOpen, language, t.welcome]);

  const handleSend = (message?: string) => {
    if (!message && !input.trim()) return;
    const userInput = message || input;
    setMessages(prev => [...prev, { text: userInput, isUser: true }]);
    if (!message) setInput('');

    // Detect language from user input
    const detectedLang = detectLanguage(userInput);
    const responseTranslations = translations[detectedLang];

    // Mock AI response in detected language
    setTimeout(() => {
      let response = '';
      const lowerInput = userInput.toLowerCase();

      if (lowerInput.includes('info') || lowerInput.includes('information') || lowerInput.includes('amakuru')) {
        response = `${responseTranslations.info}\n\n${responseTranslations.name}: ${memberProfile ? `${memberProfile.firstName} ${memberProfile.lastName}` : user?.firstName + ' ' + user?.lastName}\n${responseTranslations.phone}: ${memberProfile?.phoneNumber || user?.phoneNumber}\n${responseTranslations.email}: ${memberProfile?.email || user?.email}\n${responseTranslations.church}: ${memberProfile?.church?.name}\n${responseTranslations.passStatus}: ${memberPass ? 'Active' : 'Not Issued'}`;
      } else if (lowerInput.includes('pass') || lowerInput.includes('ikarita')) {
        response = `${responseTranslations.passStatus}: ${memberPass ? 'Active' : 'Not Issued'}. ${memberPass?.expiresAt ? `Expires: ${new Date(memberPass.expiresAt).toLocaleDateString()}` : 'No expiry.'}`;
      } else if (lowerInput.includes('attendance') || lowerInput.includes('imurikagurisha')) {
        response = `${responseTranslations.lastAttendance}: Check your attendance tab for full details.`;
      } else {
        response = responseTranslations.helpDefault;
      }

      setMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 1000);
  };

  const sendQuickMessage = (msg: string) => {
    handleSend(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) return null;

  return (
    <div style={chatContainer}>
      <div style={chatHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={20} />
          <span style={{ fontWeight: 600, fontSize: '16px' }}>Support Centre</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} style={languageSelect}>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="rw">Kinyarwanda</option>
          </select>
          <button onClick={onClose} style={closeButton} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div style={chatBody}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={msg.isUser ? userMessage : botMessage}>
              {msg.text.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', flexShrink: 0 }}>
          <button onClick={() => sendQuickMessage(t.helpButtons.accountInfo)} style={quickButtonStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}>{t.helpButtons.accountInfo}</button>
          <button onClick={() => sendQuickMessage(t.helpButtons.passStatus)} style={quickButtonStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}>{t.helpButtons.passStatus}</button>
          <button onClick={() => sendQuickMessage(t.helpButtons.attendance)} style={quickButtonStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}>{t.helpButtons.attendance}</button>
          <button onClick={() => sendQuickMessage(t.helpButtons.help)} style={quickButtonStyle} onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}>{t.helpButtons.help}</button>
        </div>
      </div>
      <div style={chatFooter}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t.askQuestion}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
        />
        <button onClick={() => handleSend()} style={buttonStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
