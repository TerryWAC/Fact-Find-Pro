import type { Metadata } from 'next'
import { LegalPage } from '@/components/shared/legal-page'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Privacy notice' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" description="Privacy policy and data protection statement for advisers using FactFind Pro and clients completing their forms. Your adviser's own privacy notice also applies to the advice process.">
      <section>
        <h2>1. Who we are</h2>
        <p>FactFind Pro is operated by {LEGAL.operator} trading as {LEGAL.tradingAs} (“we”, “us”, “our”). Our ICO registration number is {LEGAL.icoRegistration}.</p>
        <p>Contact <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> about platform privacy, adviser accounts or a data request. For questions about your answers or the advice you receive, contact the adviser identified on your form.</p>
      </section>
      <section>
        <h2>2. Our use of your information</h2>
        <p>We do not sell or rent personal data. We do not use client answers for marketing, advertising or profiling. FactFind Pro collects information for your adviser and uses service providers to operate the platform, as explained below.</p>
        <p>The platform does not make automated mortgage, insurance, medical or suitability decisions. Your adviser remains responsible for reviewing your information and any advice they give.</p>
      </section>
      <section>
        <h2>3. Data protection roles</h2>
        <p>For client information submitted through a form, the adviser or their firm is the data controller: they decide why the information is collected and how it is used. FactFind Pro acts as their data processor to provide the service on their instructions.</p>
        <p>For adviser account setup and platform administration, {LEGAL.operator} acts as the data controller for that business and account information.</p>
      </section>
      <section>
        <h2>4. Information we process</h2>
        <ul>
          <li>Adviser names, business and contact details, account and login information, branding, colleague-directory entries and delivery preferences.</li>
          <li>Client identity and contact details, financial and employment information, household and family details, and answers entered into Mortgage, Protection, Medical or Home forms.</li>
          <li>Health and medical information, and criminal-conviction information where the relevant form asks for it. Health information is special category data.</li>
          <li>Submission references and dates, review status, browser information supplied with a submission, support communications and logs of account activity and email delivery.</li>
        </ul>
        <p>Information may be entered by the client or by an adviser completing the form with them. Only provide information about another person if you are authorised to do so.</p>
      </section>
      <section>
        <h2>5. Why information is used</h2>
        <p>Client information is used to collect and present the completed record to the adviser, support their review workflow, generate requested PDF copies, prevent misuse and investigate technical issues. We do not use client answers for unrelated purposes.</p>
        <p>Adviser account information is used to register and approve accounts, provide access, manage service communications, support users, secure the platform and meet applicable legal obligations.</p>
        <p>Your adviser determines and explains their lawful basis for collecting client information, including the additional conditions needed for health or criminal-conviction information. Ask for their privacy notice before submitting if you are unsure why a question is needed. Without the required answers, the form cannot be submitted; contact your adviser to discuss another way to provide the information.</p>
      </section>
      <section>
        <h2>6. Who can access information</h2>
        <p>Approved advisers can access submissions assigned to their own account. Authorised platform administrators can access records across the platform for administration, security and support. Other advisers and anonymous visitors cannot browse these records.</p>
        <p>Adding a colleague to the adviser’s directory does not give that person a login or access to client records. Adviser-only internal notes are excluded from client PDF copies.</p>
        <ul>
          <li><strong>Supabase</strong> provides authentication, the database and branding file storage.</li>
          <li><strong>Vercel</strong> hosts and runs the application.</li>
          <li><strong>Resend</strong> processes email delivery, including PDF attachments when a copy is sent.</li>
        </ul>
        <p>These providers process information needed to deliver their services. Their infrastructure and subprocessors may operate in more than one country. Contact us for information about the arrangements that apply to your data. Information may also be disclosed where required by law.</p>
      </section>
      <section>
        <h2>7. Security and copies</h2>
        <p>We use encrypted connections, authentication and access controls to protect information, with activity and delivery logs to help investigate issues. Advisers must protect their login details and secure any system they export information into.</p>
        <p>Each adviser chooses whether completed forms trigger adviser and client PDF emails. An authorised adviser or administrator can also send a client copy manually. Messages use the FactFind email domain with adviser branding, and replies to client-copy emails go to the adviser.</p>
        <p>Downloaded PDFs and emailed attachments become separate copies held by their recipients. Removing a platform record does not remove copies from an inbox, CRM or another system.</p>
      </section>
      <section id="retention" className="scroll-mt-8">
        <h2>8. Retention and deletion requests</h2>
        <p>Completed client records are retained until deletion is requested and processed. There is no automatic 90-day deletion. Archiving a submission hides it from the active workflow but does not delete its contents.</p>
        <p>Advisers must review whether retained records are still needed and request deletion when appropriate, taking account of their purpose, legal obligations and applicable professional record-keeping requirements. Keeping records in FactFind Pro does not replace the adviser’s own record-management responsibilities.</p>
        <p>Clients should contact their adviser to request deletion. Advisers can contact <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> with the relevant submission reference. We verify the request and coordinate with the adviser before acting. We will explain if information must be retained for a legal reason. Deletion is not performed by marking a record as archived.</p>
        <p>Account information is retained while the account is needed to provide and administer the service. Contact us about account closure and removal; information needed for security investigations, disputes or legal obligations may need to be retained.</p>
        <p>Deleting an active record does not necessarily immediately remove it from a service provider’s backups or delivery logs. Contact us for the scope and timing of a deletion request. We do not promise that every copy becomes unrecoverable immediately.</p>
      </section>
      <section>
        <h2>9. Unfinished forms and device storage</h2>
        <p>Unfinished answers remain in the current browser tab. They are saved to the platform when the form is submitted; there is currently no saved draft, partial-submission dashboard or cross-device resume. Keep the tab open until you submit.</p>
        <p>The application uses authentication cookies and local device preferences for sign-in and presentation. Installing the website on a home screen does not add offline form completion.</p>
      </section>
      <section>
        <h2>10. Adviser responsibilities</h2>
        <p>Advisers are responsible for giving clients their own privacy information, documenting the lawful basis and any additional conditions for sensitive information, and meeting applicable record-keeping requirements. Check permissions before entering information about a joint applicant or another person.</p>
      </section>
      <section>
        <h2>11. Individual rights</h2>
        <p>You can ask about access, correction, deletion, restriction and portability where applicable. You may object to processing in certain circumstances. Where processing relies on your consent, you can ask the relevant controller about withdrawing it.</p>
        <p>Contact your adviser about client records, or us about adviser account information. We may need to verify your identity and coordinate with the adviser. You can also complain to the <a href="https://ico.org.uk/make-a-complaint/">UK Information Commissioner’s Office</a>.</p>
      </section>
      <section>
        <h2>12. Security incidents</h2>
        <p>If we become aware of a security incident affecting client information, we will investigate and take steps to contain it, and notify the adviser without undue delay so they can assess and meet their reporting duties.</p>
      </section>
      <section>
        <h2>13. Changes to this notice</h2>
        <p>We may update this notice as the service changes. The current version and date appear above. Where changes are significant, we will take reasonable steps to notify advisers through the platform or by email.</p>
      </section>
    </LegalPage>
  )
}
