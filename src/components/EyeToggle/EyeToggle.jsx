import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { usePrivacy } from '../../context/PrivacyContext';
import './EyeToggle.css';

export default function EyeToggle() {
  const { hideValues, setHideValues } = usePrivacy();
  const [modal, setModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleEyeClick = () => {
    setModal(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !passwordInput) return;
    setChecking(true);
    setPasswordError('');
    try {
      await reauthenticateWithCredential(
        auth.currentUser,
        EmailAuthProvider.credential(auth.currentUser.email, passwordInput)
      );
      setHideValues((prev) => !prev);
      setModal(false);
      setPasswordInput('');
    } catch {
      setPasswordError('Senha incorreta. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button
        className="eye-toggle-btn"
        onClick={handleEyeClick}
        title={hideValues ? "Mostrar valores (requer senha)" : "Ocultar valores (requer senha)"}
      >
        {hideValues ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>

      {modal && (
        <div className="modal-overlay" onClick={() => !checking && setModal(false)}>
          <form className="modal-card" onSubmit={handleConfirm} onClick={(e) => e.stopPropagation()}>
            <h3>{hideValues ? 'Mostrar valores' : 'Ocultar valores'}</h3>
            <p className="modal-hint">
              Digite sua senha para {hideValues ? 'mostrar' : 'ocultar'} os valores.
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
            />
            {passwordError && <p className="login-error">{passwordError}</p>}
            <div className="modal-actions">
              <button type="submit" className="btn-primary" disabled={checking || !passwordInput}>
                {checking ? 'Verificando...' : 'Confirmar'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setModal(false)} disabled={checking}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
