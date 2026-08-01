import React, { useState } from 'react';
import { Bus, LogIn, UserPlus, ShieldCheck, Phone, Lock, User, FileCheck, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../services/db.js';

export default function AuthLandingView({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);

  // Form Fields per PRD Specs
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofFile, setIdProofFile] = useState(null);
  const [fileTextContent, setFileTextContent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdProofFile(file);

    // OCR / File Text Reader Simulation
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result || '';
      setFileTextContent(content.toString());
    };
    reader.readAsText(file);
  };

  const handleSelectSampleDoc = (sampleType) => {
    if (sampleType === 'Aadhaar') {
      setIdProofFile({ name: 'aadhaar_card_govt_of_india.png' });
      setFileTextContent('Government of India Unique Identification Authority of India Aadhaar 8942 1200 9901 Mera Aadhaar');
    } else if (sampleType === 'PAN') {
      setIdProofFile({ name: 'pan_card_income_tax_dept.pdf' });
      setFileTextContent('Income Tax Department Permanent Account Number PAN Card ABCDE1234F Govt of India');
    } else if (sampleType === 'DL') {
      setIdProofFile({ name: 'driving_licence_transport_dept.jpg' });
      setFileTextContent('Driving Licence DL No AP39202612345 Transport Department Union of India Licence to Drive');
    } else if (sampleType === 'Screenshot') {
      setIdProofFile({ name: 'screenshot_bus_ticket_2026.png' });
      setFileTextContent('Screenshot 2026-04-23 Movie Booking Bus Ticket Receipt Random Image');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const user = db.loginPassenger(mobileNumber, password);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const fileName = idProofFile ? idProofFile.name : '';
      const res = db.registerPassenger({
        name,
        mobile_number: mobileNumber,
        id_proof_type: idProofType,
        fileTextContent,
        fileName,
        password,
        confirmPassword,
      });
      if (onAuthSuccess) onAuthSuccess(res.passenger);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
      {/* Brand Hero Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'var(--color-primary)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          margin: '0 auto 12px auto',
          boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
        }}>
          <Bus size={28} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>QR Bus Pass Wallet</h2>
      </div>

      {/* Main Auth Form Card */}
      <div className="ui-card" style={{ width: '100%', maxWidth: '460px', padding: '24px' }}>
        {/* Toggle Mode Pills */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '18px' }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? 'var(--color-primary)' : 'var(--color-text-sub)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: !isRegister ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => { setIsRegister(false); setErrorMessage(''); }}
          >
            <LogIn size={15} />
            <span>Login</span>
          </button>

          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? 'var(--color-primary)' : 'var(--color-text-sub)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: isRegister ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => { setIsRegister(true); setErrorMessage(''); }}
          >
            <UserPlus size={15} />
            <span>New Registration</span>
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {/* Registration Mode Extra Fields */}
          {isRegister && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
                Passenger Name (Required)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S. Anitha Devi"
                  required
                />
                <User size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
              Phone Number (Required)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                className="form-input"
                style={{ paddingLeft: '34px' }}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="10-digit phone number..."
                required
              />
              <Phone size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Registration Mode: Strict Govt ID Selection & File OCR Upload */}
          {isRegister && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
                  Government ID Proof Type (Required)
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-select"
                    style={{ paddingLeft: '34px' }}
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Driving Licence">Driving Licence</option>
                  </select>
                  <FileCheck size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Upload Govt ID File with OCR Validator */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
                  Upload Government ID Proof File (Strict Type Validation)
                </label>
                <div style={{
                  border: '1px dashed var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px',
                  background: '#f8fafc',
                  textAlign: 'center'
                }}>
                  <input
                    type="file"
                    accept="image/*,.pdf,.txt"
                    id="id-proof-upload"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="id-proof-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    <Upload size={14} />
                    <span>{idProofFile ? `Uploaded: ${idProofFile.name}` : 'Click to Upload Aadhaar / PAN / DL Image'}</span>
                  </label>
                </div>

                {/* Demo OCR Document Samples for Instant Validation Testing */}
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--color-text-sub)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Or test with Sample Documents:</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-pill" style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => handleSelectSampleDoc('Aadhaar')}>
                      📄 Aadhaar Card
                    </button>
                    <button type="button" className="btn-pill" style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => handleSelectSampleDoc('PAN')}>
                      📄 PAN Card
                    </button>
                    <button type="button" className="btn-pill" style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => handleSelectSampleDoc('DL')}>
                      📄 Driving Licence
                    </button>
                    <button type="button" className="btn-pill" style={{ fontSize: '9px', padding: '2px 6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleSelectSampleDoc('Screenshot')}>
                      ❌ Screenshot / Bus Ticket
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Password Field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
              Password (Required)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '34px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters..."
                required
              />
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Confirm Password Field */}
          {isRegister && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-sub)', marginBottom: '4px', display: 'block' }}>
                Confirm Password (Required)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm..."
                  required
                />
                <Lock size={15} style={{ position: 'absolute', left: '10px', top: '13px', color: '#94a3b8' }} />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '15px' }}>
            {!isRegister ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{!isRegister ? 'Login to Wallet' : 'Validate ID & Complete Registration'}</span>
          </button>
        </form>
      </div>

      {/* Security & Legal Compliance Footer */}
      <div style={{ fontSize: '10px', color: 'var(--color-text-sub)', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center', maxWidth: '420px' }}>
        <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0 }} />
        <span>Strict eKYC Document Validation • Masked Numbers • Encrypted Privacy</span>
      </div>
    </div>
  );
}
