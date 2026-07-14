/**
 * Professional placeholder content for the editable legal/company pages.
 * Admins customize these from Admin → Pages. Keep the slugs stable — the
 * frontend routes /pages/:slug and the footer link to them.
 */
export interface DefaultPage {
  slug: string;
  title: string;
  html: string;
}

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    html: `<h2>Privacy Policy</h2>
<p><em>Last updated: [DATE]</em></p>
<p>[COMPANY NAME] ("we", "us") operates this facility map application. This policy explains what information the application handles and how.</p>
<h3>Information we collect</h3>
<p>The public map can be used without an account. Preferences such as favorites, recently viewed zones, language and personal notes are stored <strong>only in your browser</strong> (localStorage) and are never transmitted to us.</p>
<p>If backend mode is enabled by your organization, zone view counts may be recorded anonymously for facility-usage insights, and staff accounts (name, email, hashed password) are stored to provide access control.</p>
<h3>Cookies and local storage</h3>
<p>We use browser storage strictly for functional purposes: theme, language, saved locations and admin sessions. No advertising or cross-site tracking is used.</p>
<h3>Data retention &amp; your rights</h3>
<p>Staff account data is retained while the account is active. Contact us at [CONTACT EMAIL] to request access, correction or deletion of your data.</p>
<h3>Changes</h3>
<p>We may update this policy from time to time. Material changes will be announced on this page.</p>`,
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    html: `<h2>Terms of Service</h2>
<p><em>Last updated: [DATE]</em></p>
<p>By accessing this facility map application provided by [COMPANY NAME], you agree to these terms.</p>
<h3>Permitted use</h3>
<p>The application is provided to help staff, visitors and new hires navigate our facilities. You may not attempt to gain unauthorized access to administrative functions, probe or disrupt the service, or misuse facility information.</p>
<h3>Accuracy of information</h3>
<p>Floor plans, zone details and safety notes are provided for orientation purposes. Always follow posted signage and instructions from facility staff — they take precedence over this application.</p>
<h3>Accounts</h3>
<p>Where staff accounts exist, you are responsible for keeping your credentials confidential and for activity under your account.</p>
<h3>Liability</h3>
<p>The application is provided "as is" without warranties of any kind. To the maximum extent permitted by law, [COMPANY NAME] is not liable for damages arising from use of the application.</p>`,
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    html: `<h2>Cookie Policy</h2>
<p><em>Last updated: [DATE]</em></p>
<p>This application does not use advertising or third-party tracking cookies.</p>
<h3>What we store in your browser</h3>
<ul>
<li><strong>Theme &amp; language</strong> — your dark/light and English/Sinhala preference.</li>
<li><strong>Favorites, recents &amp; notes</strong> — zones you star or view and personal notes, kept only on your device.</li>
<li><strong>Admin session</strong> — a session flag or authentication tokens while an administrator is signed in.</li>
</ul>
<p>You can clear all of this at any time from your browser settings; the application will keep working with defaults.</p>`,
  },
  {
    slug: 'about',
    title: 'About Us',
    html: `<h2>About [COMPANY NAME]</h2>
<p>[COMPANY NAME] is committed to a safe, efficient and welcoming workplace. This interactive facility map helps new hires find their way from day one and gives every employee instant access to zone information, contacts and safety requirements.</p>
<h3>What you can do here</h3>
<ul>
<li>Explore interactive floor plans of all our buildings</li>
<li>Scan QR codes posted around the facility to see exactly where you are</li>
<li>Find safety equipment, first aid stations and emergency exits</li>
<li>Check zone details, contacts and current status</li>
</ul>
<p>Questions or corrections? Reach us via the <a href="/pages/contact">contact page</a>.</p>`,
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    html: `<h2>Contact Us</h2>
<p>Have a question about the facility, spotted an outdated zone, or need help with the map? We'd love to hear from you.</p>
<ul>
<li><strong>Facilities team:</strong> [CONTACT EMAIL]</li>
<li><strong>Phone:</strong> [PHONE NUMBER]</li>
<li><strong>Address:</strong> [COMPANY ADDRESS]</li>
</ul>
<p>Use the form below and the facilities team will get back to you.</p>`,
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    html: `<h2>Refund Policy</h2>
<p><em>Last updated: [DATE]</em></p>
<p>[If your organization sells access or services through this application, describe your refund terms here. If the application is internal-only, you may replace this page or hide the link.]</p>
<h3>Requesting a refund</h3>
<p>Contact [CONTACT EMAIL] with your order reference. Eligible refunds are processed to the original payment method within 5–10 business days.</p>`,
  },
  {
    slug: 'license',
    title: 'License Information',
    html: `<h2>License Information</h2>
<p>This application is powered by <strong>FacilityFlow — Interactive Facility Map &amp; Wayfinding CMS</strong>.</p>
<p>FacilityFlow is commercial software licensed under the Envato Market License. A <strong>Regular License</strong> covers one end product for you or one client where end users are not charged. An <strong>Extended License</strong> is required if end users are charged for access.</p>
<p>Third-party open-source components (React, Express, Tailwind CSS and others) remain under their respective licenses; see the product documentation for the full list.</p>
<p>[COMPANY NAME]'s own facility content — floor plans, photos, text — remains the property of [COMPANY NAME].</p>`,
  },
];
