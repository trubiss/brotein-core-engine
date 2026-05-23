import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
        <h1 className="text-2xl font-black tracking-[0.15em]">TERMS OF SERVICE</h1>
      </div>

      <p className="label-spaced mb-8">EFFECTIVE: MAY 16, 2026</p>

      <div className="space-y-8 font-sans text-[15px] leading-relaxed">
        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">1. ACCEPTANCE</h2>
          <p>By creating an account or using Brotein you agree to these terms.</p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">2. ELIGIBILITY</h2>
          <p>You must be 13 or older. If you are under 18 you must have a guardian's consent.</p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">3. YOUR ACCOUNT</h2>
          <p>
            You are responsible for your credentials and for activity on your account. Keep your
            password private.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">4. SUBSCRIPTION & TRIAL</h2>
          <p>
            Brotein offers auto-renewing subscriptions sold through Apple's App Store:
            an annual plan at <span className="font-mono font-bold">$39.99 / year</span> with a
            7-day free trial, and a monthly plan at{' '}
            <span className="font-mono font-bold">$4.99 / month</span> with no trial. Prices may
            vary by region and are shown in your local currency at purchase.
          </p>
          <p className="mt-3">
            Payment is charged to your Apple ID account at confirmation of purchase. The
            subscription automatically renews at the same price unless auto-renew is turned off at
            least 24 hours before the end of the current period. Your account will be charged for
            renewal within 24 hours prior to the end of the current period. You can manage or cancel
            your subscription at any time in your iPhone Settings → [your name] → Subscriptions.
          </p>
          <p className="mt-3">
            If you start the free trial and do not cancel before it ends, your Apple ID will be
            charged for the annual plan. Any unused portion of a free trial is forfeited when you
            purchase a subscription.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">5. NOT MEDICAL ADVICE</h2>
          <p>
            Brotein provides protein and nutrition tracking for informational purposes only. It is
            not medical, dietary, or fitness advice. Consult a qualified professional before making
            changes to your diet or training, especially if you have a medical condition.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">6. ACCEPTABLE USE</h2>
          <p>
            Do not abuse the service, attempt to reverse engineer it, scrape it, or use it to harm
            others.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">7. LIMITATION OF LIABILITY</h2>
          <p>
            Brotein is provided "as is" without warranty of any kind. To the maximum extent permitted
            by law, we are not liable for indirect, incidental, or consequential damages arising from
            your use of the app.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">8. TERMINATION</h2>
          <p>
            You can delete your account at any time from{' '}
            <span className="font-mono font-bold">PROFILE → DELETE ACCOUNT</span>. We may suspend or
            terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">9. CHANGES</h2>
          <p>
            We may update these terms. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-base font-black uppercase tracking-[0.15em] mb-3">10. CONTACT</h2>
          <p>
            <span className="font-mono font-bold">support@brotein.app</span>
          </p>
        </section>
      </div>
    </div>
  );
}
