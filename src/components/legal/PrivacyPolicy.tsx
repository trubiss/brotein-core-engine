import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="screen-container pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="p-2 border-2 border-foreground active:scale-95 transition-transform shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-[0.15em]">PRIVACY POLICY</h1>
      </div>

      <p className="label-spaced mb-8">EFFECTIVE: MAY 16, 2026</p>

      <div className="space-y-8 font-sans text-[15px] leading-relaxed">
        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">1. WHAT WE COLLECT</h2>
          <p>
            To make Brotein work we collect: your email address, name, body weight, height, goal
            (build / maintain / recover), and the food logs you create. We do not collect contacts,
            location, advertising identifiers, or device fingerprints.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">2. WHY WE COLLECT IT</h2>
          <p>
            Your body data is used to calculate your daily protein target. Your food logs power the
            home screen, history, streak, and insights. Your email is used for authentication and
            account recovery only.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">3. WHERE IT LIVES</h2>
          <p>
            Data is stored in a secure cloud database operated on your behalf. Some preferences are
            cached on your device. We do not sell your data. We do not run ad networks. We do not
            share data with marketing partners.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">4. THIRD PARTIES</h2>
          <p>
            We use Google Firebase for authentication and database hosting. If you opt to scan food,
            the image is sent to our scanning service for one-time analysis and not retained.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">5. YOUR RIGHTS</h2>
          <p>
            You can edit your profile at any time. You can permanently delete your account and all
            associated data from <span className="font-mono font-bold">PROFILE → DELETE ACCOUNT</span>.
            Deletion is immediate and irreversible.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">6. CHILDREN</h2>
          <p>Brotein is not directed at children under 13. We do not knowingly collect data from them.</p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">7. CHANGES</h2>
          <p>
            We may update this policy. Material changes will be surfaced in-app before they take
            effect.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">8. CONTACT</h2>
          <p>
            Questions, requests, or complaints: <span className="font-mono font-bold">support@brotein.app</span>
          </p>
        </section>
      </div>
    </div>
  );
}
