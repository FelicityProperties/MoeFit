import type { Metadata } from "next";
import { LegalPage, SUPPORT_CONTACT } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — FeliHealth" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>
        This policy explains what FeliHealth collects, why, and what you can do about it.
        We keep it short on purpose.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your name, email and profile picture from Google when
          you sign in. We never see your Google password.
        </li>
        <li>
          <strong>Health &amp; lifestyle data you enter:</strong> weight, goals, meals,
          calories, water, workouts, routines, notes and coach conversations.
        </li>
        <li>
          <strong>Meal photos:</strong> processed to estimate calories and then discarded.
          They are not stored in your account.
        </li>
        <li>
          <strong>Billing:</strong> your subscription status. Card details are handled
          entirely by Stripe and never touch our servers.
        </li>
        <li>
          <strong>Technical:</strong> standard server logs (IP address, browser, timestamps)
          used for security and reliability.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <p>
        To run the Service: sync your data across your devices, calculate your targets,
        generate coaching responses, manage your subscription, and keep the Service secure.
        We don&apos;t sell your data and we don&apos;t use it for advertising.
      </p>

      <h2>3. Who processes it for us</h2>
      <ul>
        <li><strong>Vercel</strong> — hosts the application.</li>
        <li><strong>Neon</strong> — stores your account data (Postgres).</li>
        <li>
          <strong>Anthropic</strong> — provides the AI. When you use an AI feature, the
          relevant data (your message, meal description or photo, and your current stats)
          is sent to generate the response.
        </li>
        <li><strong>Stripe</strong> — processes payments and subscriptions.</li>
        <li><strong>Google</strong> — sign-in.</li>
      </ul>
      <p>Each processes data only as needed to provide their service to us.</p>

      <h2>4. Where it lives and how long</h2>
      <p>
        Your data is stored for as long as your account exists. A copy is also cached in
        your browser on each device you use so the app works offline. Server logs are
        retained for a limited period for security purposes.
      </p>

      <h2>5. Your controls</h2>
      <ul>
        <li><strong>Export</strong> everything as JSON from Settings → Your Data.</li>
        <li>
          <strong>Delete</strong> your data from Settings → Your Data (Reset), or contact
          us to delete your account entirely.
        </li>
        <li><strong>Cancel</strong> your subscription anytime from Settings → Billing.</li>
        <li>You can request a copy, correction or deletion of your data by contacting us.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS) and stored with reputable providers. Sessions
        use secure, HTTP-only cookies. No system is perfectly secure, so please keep your
        Google account protected.
      </p>

      <h2>7. Children</h2>
      <p>The Service is not intended for anyone under 18, and we don&apos;t knowingly collect their data.</p>

      <h2>8. Changes</h2>
      <p>If we make material changes to this policy we&apos;ll update the date above and, where appropriate, notify you in the app.</p>

      <h2>9. Contact</h2>
      <p>Privacy questions or requests: {SUPPORT_CONTACT}.</p>
    </LegalPage>
  );
}
