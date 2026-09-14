import type { Metadata } from "next";
import { LegalPage, SUPPORT_CONTACT } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service — FeliHealth" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="September 2026">
      <p>
        These Terms govern your use of FeliHealth (the &quot;Service&quot;). By creating an
        account or using the Service you agree to them. If you don&apos;t agree, please
        don&apos;t use the Service.
      </p>

      <h2>1. What FeliHealth is — and isn&apos;t</h2>
      <p>
        FeliHealth is a self-tracking and coaching tool for nutrition, exercise and daily
        routine. <strong>It is not medical advice, diagnosis or treatment.</strong> Calorie
        and nutrition figures — including those estimated from photos or descriptions by
        the AI — are approximations. Always consult a qualified healthcare professional
        before starting a diet or exercise programme, especially if you have a medical
        condition, are pregnant, or take medication. Stop and seek medical help if you feel
        unwell.
      </p>

      <h2>2. Your account</h2>
      <p>
        You sign in with a Google account. You&apos;re responsible for keeping that account
        secure and for everything done through it. You must be at least 18 years old (or
        the age of majority where you live) to use the Service.
      </p>

      <h2>3. Free and Pro plans</h2>
      <ul>
        <li>The Free plan includes manual tracking features at no charge.</li>
        <li>
          FeliHealth Pro is a recurring subscription that unlocks AI-powered features. The
          price and billing interval are shown at checkout.
        </li>
        <li>
          Payments are processed by Stripe. We don&apos;t store your card details. Your
          subscription renews automatically until you cancel; you can cancel anytime from
          Settings → Billing, and Pro access continues until the end of the paid period.
        </li>
        <li>
          Except where required by law, payments are non-refundable. We may change prices
          with reasonable advance notice; changes apply from your next billing period.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>
        Don&apos;t misuse the Service: no attempts to access other users&apos; data,
        overload or reverse-engineer the Service, use it for anything unlawful, or use the
        AI features to generate harmful content. We may suspend accounts that break these
        rules.
      </p>

      <h2>5. Your content</h2>
      <p>
        You own the data you enter (meals, weights, notes, photos). You grant us the
        limited rights needed to store and process it to provide the Service — including
        sending relevant data to our AI provider to generate your coaching responses.
        You can export or delete your data at any time from Settings.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        We work hard to keep the Service running but don&apos;t guarantee uninterrupted
        availability. We may change, add or remove features, and may update these Terms;
        continued use after an update means you accept the new Terms.
      </p>

      <h2>7. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. To the
        fullest extent permitted by law, we are not liable for any indirect, incidental or
        consequential loss, or for any health outcome resulting from your use of the
        Service. Our total liability for any claim is limited to the amount you paid us in
        the 12 months before the claim.
      </p>

      <h2>8. Termination</h2>
      <p>
        You can stop using the Service and delete your data at any time. We may terminate
        or suspend access for breach of these Terms.
      </p>

      <h2>9. Contact</h2>
      <p>Questions about these Terms? Reach us at {SUPPORT_CONTACT}.</p>
    </LegalPage>
  );
}
