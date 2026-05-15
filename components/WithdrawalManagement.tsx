import { useState, useEffect } from 'react';

import { getPublicApiBaseUrl } from '@/lib/public-api-url';

const API_BASE = getPublicApiBaseUrl();

type WithdrawalMethod = {
  id: number;
  name: string;
  type: 'bank' | 'wallet';
  logo_url: string;
};

const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia",
  "Development Bank",
  "Dashan Bank",
  "Bank of Abissinaiya",
  "Awash Bank",
  "Wegagen Bank",
  "Nib Bank",
  "United Bank",
  "Bank of Oromia",
  "Zemen Bank",
  "Buna Bank",
  "Abay Bank",
  "Amhara Bank"
];

const WALLETS = [
  "telebirr",
  "CBE birr",
  "Amole",
  "Mpesa"
];

type WithdrawalManagementProps = {
  onClose: () => void;
};

export default function WithdrawalManagement({ onClose }: WithdrawalManagementProps) {
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [type, setType] = useState<'bank' | 'wallet'>('bank');
  const [selectedName, setSelectedName] = useState(ETHIOPIAN_BANKS[0]);
  
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  useEffect(() => {
    setSelectedName(type === 'bank' ? ETHIOPIAN_BANKS[0] : WALLETS[0]);
  }, [type]);

  const fetchMethods = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/withdrawal-methods`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch methods:', error);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setLogo(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend Duplicate Check
    const isDuplicate = methods.some(m => m.name === selectedName);
    if (isDuplicate) {
      setError(`${selectedName} is already added!`);
      return;
    }

    if (!logo) {
      setError('Please select a logo first');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', logo);
      formData.append('upload_preset', 'pioneerbusiness');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/dk07dayip/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) throw new Error('Upload failed');

      // 2. Save to Backend
      const response = await fetch(`${API_BASE}/admin/withdrawal-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: selectedName,
          type,
          logoUrl: cloudData.secure_url
        })
      });

      const data = await response.json();

      if (response.ok) {
        fetchMethods();
        setLogo(null);
        setPreviewUrl(null);
      } else {
        setError(data.message || 'Failed to add method');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      setError('Connection error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await fetch(`${API_BASE}/admin/withdrawal-methods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setMethods(methods.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-[#F8FAFC] text-[#1A202C] flex flex-col h-screen overflow-hidden">
      <header className="bg-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full transition-all active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-xl font-black text-[#1A202C] tracking-tighter">Withdrawal M</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-900 mb-6">Add withdrawal method</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex p-1 bg-gray-50 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('bank')}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${type === 'bank' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Banks
              </button>
              <button
                type="button"
                onClick={() => setType('wallet')}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${type === 'wallet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Wallets
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-1">Select {type}</label>
              <select
                value={selectedName}
                onChange={(e) => {
                  setSelectedName(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-900 focus:bg-white focus:border-gray-200 outline-none transition-all appearance-none"
              >
                {(type === 'bank' ? ETHIOPIAN_BANKS : WALLETS).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-1">Provider logo</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-[#F8FAFC] border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all">
                  {previewUrl ? (
                    <div className="relative w-20 h-20 bg-white rounded-xl shadow-md p-2 border border-gray-100">
                      <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                  )}
                  <div className="text-[10px] font-black text-gray-400">{logo ? logo.name : 'Click to select logo'}</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in zoom-in-95 duration-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs active:scale-95 transition-all shadow-xl shadow-gray-100 disabled:bg-gray-400"
            >
              {uploading ? 'Processing...' : 'Add withdrawal method'}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-black text-gray-900 ml-2">Active methods</h2>
          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div></div>
            ) : methods.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                <div className="text-xs font-black text-gray-400">No methods found</div>
              </div>
            ) : (
              methods.map((method) => (
                <div key={method.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 flex items-center justify-between group animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center p-2">
                      <img src={method.logo_url} alt={method.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm tracking-tight">{method.name}</div>
                      <div className="text-[10px] font-black text-gray-400 capitalize">{method.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
