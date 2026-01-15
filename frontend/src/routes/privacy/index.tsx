import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Shield, Eye, Database, Users, FileText, Globe } from "lucide-icons-qwik";

export default component$(() => {
  return (
    <div class="min-h-screen bg-theme-bg-primary p-4 sm:p-6">
      <div class="mx-auto max-w-4xl">
        {/* Header */}
        <div class="mb-8">
          <div class="card-cute rounded-3xl p-6 text-center">
            <div class="mb-4 flex justify-center">
              <div class="rounded-full bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary p-3">
                <Shield class="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 class="text-gradient-cute mb-2 text-3xl font-bold">
              Privacy Policy
            </h1>
            <p class="text-theme-text-secondary">
              How we collect, use, and protect your information
            </p>
            <p class="text-theme-text-muted mt-2 text-sm">
              Last updated: June 28, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div class="space-y-6">
          {/* Introduction */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <FileText class="h-5 w-5" />
              Introduction
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                Welcome to twink.forsale ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our file hosting and sharing service.
              </p>
              <p>
                We are committed to protecting your privacy and being transparent about our data practices. This policy describes the types of information we collect, how we use it, and the choices you have regarding your information.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Database class="h-5 w-5" />
              Information We Collect
            </h2>
            <div class="space-y-4">
              {/* Account Information */}
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Account Information</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• Discord profile information (username, email, avatar, user ID)</li>
                  <li>• Account preferences and settings</li>
                  <li>• API keys you generate for programmatic access</li>
                </ul>
              </div>

              {/* File Data */}
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">File Data</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• Files you upload (images, documents, etc.)</li>
                  <li>• File metadata (names, sizes, types, upload timestamps)</li>
                  <li>• Custom file settings (expiration dates, view limits)</li>
                </ul>
              </div>

              {/* Usage Analytics */}
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Usage Analytics</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• IP addresses (first two octets only for privacy)</li>
                  <li>• Device information and browser type</li>
                  <li>• File view and download statistics</li>
                  <li>• Referrer information and access patterns</li>
                  <li>• Bio page visit analytics</li>
                </ul>
              </div>

              {/* Bio Service Data */}
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Bio Service Data</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• Custom bio pages (usernames, descriptions, links)</li>
                  <li>• Discord integration data (real-time status, activities)</li>
                  <li>• Custom styling and appearance preferences</li>
                  <li>• Bio page view statistics</li>
                </ul>
              </div>

              {/* Technical Data */}
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Technical Data</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• Session cookies for authentication</li>
                  <li>• Preference cookies (theme, settings)</li>
                  <li>• Log files for security and performance monitoring</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Eye class="h-5 w-5" />
              How We Use Your Information
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>We use the information we collect for the following purposes:</p>
              <ul class="space-y-2">
                <li>• <strong>Service Operation:</strong> To provide file hosting, sharing, and bio page services</li>
                <li>• <strong>Account Management:</strong> To manage your account, authentication, and user preferences</li>
                <li>• <strong>Analytics:</strong> To generate usage statistics and improve our service</li>
                <li>• <strong>Security:</strong> To protect against abuse, spam, and unauthorized access</li>
                <li>• <strong>Communication:</strong> To send important service updates and notifications</li>
                <li>• <strong>Features:</strong> To enable Discord integration, custom domains, and bio services</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Users class="h-5 w-5" />
              Data Sharing and Third Parties
            </h2>
            <div class="space-y-4">
              <div class="text-theme-text-secondary text-sm leading-relaxed">
                <p class="mb-4">We may share your information with third parties in the following circumstances:</p>
              </div>

              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Service Providers</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm">
                  <li>• <strong>Discord:</strong> For OAuth authentication and profile data</li>
                  <li>• <strong>Lanyard API:</strong> For real-time Discord status integration</li>
                  <li>• <strong>Hosting Providers:</strong> For server infrastructure and data storage</li>
                </ul>
              </div>

              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Legal Requirements</h3>
                <p class="text-theme-text-secondary text-sm">
                  We may disclose information if required by law, legal process, or to protect the rights, property, or safety of our users or others.
                </p>
              </div>

              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">Public Information</h3>
                <p class="text-theme-text-secondary text-sm">
                  Files you choose to share publicly and bio pages marked as public are accessible to anyone with the link.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Shield class="h-5 w-5" />
              Data Security
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>We implement appropriate security measures to protect your information:</p>
              <ul class="space-y-2">
                <li>• Secure HTTPS encryption for all data transmission</li>
                <li>• Access controls and authentication requirements</li>
                <li>• IP address anonymization (only first two octets stored)</li>
              </ul>
              <p class="text-theme-text-muted mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Database class="h-5 w-5" />
              Data Retention
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>We retain your information for the following periods:</p>
              <ul class="space-y-2">
                <li>• <strong>Account Data:</strong> Until you delete your account</li>
                <li>• <strong>Files:</strong> Until expiration date or manual deletion</li>
                <li>• <strong>Analytics Data:</strong> Up to 2 years for performance analysis</li>
                <li>• <strong>Log Files:</strong> Up to 30 days for security purposes</li>
                <li>• <strong>Bio Pages:</strong> Until you deactivate or delete them</li>
              </ul>
              <p>
                You can request deletion of your data at any time by contacting us or using the account deletion features in your dashboard.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Users class="h-5 w-5" />
              Your Rights and Choices
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>You have the following rights regarding your personal information:</p>
              <ul class="space-y-2">
                <li>• <strong>Access:</strong> View and download your personal data</li>
                <li>• <strong>Correction:</strong> Update or correct inaccurate information</li>
                <li>• <strong>Deletion:</strong> Request deletion of your account and data</li>
                <li>• <strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li>• <strong>Opt-out:</strong> Disable analytics tracking or Discord integration</li>
                <li>• <strong>Consent Withdrawal:</strong> Revoke consent for data processing</li>
              </ul>
              <p class="mt-4">
                To exercise these rights, use the controls in your account dashboard or contact us directly.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Globe class="h-5 w-5" />
              Cookies and Tracking
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>We use cookies and similar technologies for:</p>
              <ul class="space-y-2">
                <li>• <strong>Essential Cookies:</strong> Authentication and security</li>
                <li>• <strong>Preference Cookies:</strong> Theme settings and user preferences</li>
                <li>• <strong>Analytics Cookies:</strong> Usage statistics and performance monitoring</li>
              </ul>
              <p class="mt-4">
                You can control cookies through your browser settings, but disabling essential cookies may affect site functionality.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Children's Privacy
            </h2>
            <div class="text-theme-text-secondary text-sm leading-relaxed">
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe we have collected information from your child, please contact us immediately.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              International Data Transfers
            </h2>
            <div class="text-theme-text-secondary text-sm leading-relaxed">
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers, in accordance with applicable data protection laws.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Changes to This Privacy Policy
            </h2>
            <div class="text-theme-text-secondary text-sm leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Contact Us
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div class="border-theme-card-border rounded-lg border p-4">
                <ul class="space-y-2">
                  <li>• <strong>Discord:</strong> @akiradev</li>
                  <li>• <strong>Email:</strong> <a href="mailto:contact@bwmp.dev" class="text-theme-accent-primary hover:underline">contact@bwmp.dev</a></li>
                  <li>• <strong>GitHub:</strong> <a href="https://github.com/LuminescentDev/twinkforsale" class="text-theme-accent-primary hover:underline">Project Repository</a></li>
                </ul>
              </div>
              <p class="text-theme-text-muted">
                We will respond to your inquiry within 30 days.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div class="mt-8 text-center">
          <p class="text-theme-text-muted text-xs">
            This privacy policy is effective as of June 28, 2025
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Privacy Policy - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Privacy Policy for twink.forsale - Learn how we collect, use, and protect your personal information.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ],
};