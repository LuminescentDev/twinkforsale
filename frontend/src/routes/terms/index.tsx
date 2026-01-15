import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { FileText, Shield, AlertTriangle, Users, Globe, Scale } from "lucide-icons-qwik";

export default component$(() => {
  return (
    <div class="min-h-screen bg-theme-bg-primary p-4 sm:p-6">
      <div class="mx-auto max-w-4xl">
        {/* Header */}
        <div class="mb-8">
          <div class="card-cute rounded-3xl p-6 text-center">
            <div class="mb-4 flex justify-center">
              <div class="rounded-full bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary p-3">
                <Scale class="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 class="text-gradient-cute mb-2 text-3xl font-bold">
              Terms of Service
            </h1>
            <p class="text-theme-text-secondary">
              Legal terms and conditions for using twink.forsale
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
              Agreement to Terms
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                Welcome to twink.forsale ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our file hosting and sharing service located at twink.forsale (the "Service") operated by twink.forsale.
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
              <p class="bg-theme-accent-primary/10 border-theme-accent-primary/30 rounded-lg border p-3">
                <strong>Important:</strong> This is a private, application-only service. Account creation requires admin approval, and usage is subject to strict content guidelines.
              </p>
            </div>
          </section>

          {/* Account Registration */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Users class="h-5 w-5" />
              Account Registration and Approval
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>To use our Service, you must:</p>
              <ul class="space-y-2 list-disc list-inside">
                <li>Register through Discord OAuth authentication</li>
                <li>Provide accurate and complete information</li>
                <li>Wait for admin approval before gaining full access</li>
                <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
                <li>Comply with Discord's Terms of Service</li>
              </ul>
              <div class="bg-yellow-500/10 border-yellow-500/30 rounded-lg border p-3">
                <p><strong>Account Approval:</strong> We reserve the right to approve or deny account applications at our sole discretion. Accounts may be denied for any reason, including but not limited to suspected misuse or violation of these terms.</p>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Shield class="h-5 w-5" />
              Acceptable Use Policy
            </h2>
            <div class="space-y-4">
              <div class="text-theme-text-secondary text-sm leading-relaxed">
                <p class="mb-4">You agree NOT to use the Service to upload, share, or distribute content that:</p>
              </div>

              <div class="bg-red-500/10 border-red-500/30 rounded-lg border p-4">
                <h3 class="text-red-400 mb-2 font-semibold">Prohibited Content</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm list-disc list-inside">
                  <li>Violates any local, state, national, or international law</li>
                  <li>Infringes on intellectual property rights (copyright, trademark, etc.)</li>
                  <li>Contains malware, viruses, or other harmful code</li>
                  <li>Is pornographic, sexually explicit, or contains nudity</li>
                  <li>Promotes violence, hatred, or discrimination</li>
                  <li>Contains personal information of others without consent</li>
                  <li>Is spam, phishing, or fraudulent content</li>
                  <li>Violates Discord's Community Guidelines or Terms of Service</li>
                </ul>
              </div>

              <div class="bg-green-500/10 border-green-500/30 rounded-lg border p-4">
                <h3 class="text-green-400 mb-2 font-semibold">Appropriate Use</h3>
                <ul class="text-theme-text-secondary space-y-1 text-sm list-disc list-inside">
                  <li>Screenshots and images for legitimate sharing</li>
                  <li>Documents and files for personal or professional use</li>
                  <li>Content you own or have permission to share</li>
                  <li>Non-commercial personal use</li>
                </ul>
              </div>
            </div>
          </section>

          {/* File Storage and Retention */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <FileText class="h-5 w-5" />
              File Storage and Retention
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>Regarding your uploaded files:</p>
              <ul class="space-y-2 list-disc list-inside">
                <li>Files may be subject to storage limits based on your account type</li>
                <li>Files may expire based on settings you configure</li>
                <li>Files may be automatically deleted after a period of inactivity</li>
                <li>We reserve the right to remove files that violate these terms</li>
                <li>You are responsible for maintaining backups of important files</li>
              </ul>
              <div class="bg-blue-500/10 border-blue-500/30 rounded-lg border p-3">
                <p><strong>No Guarantee:</strong> While we strive to maintain file availability, we do not guarantee permanent storage. Always keep backups of important files.</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Scale class="h-5 w-5" />
              Intellectual Property Rights
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                You retain ownership of content you upload. By uploading content, you grant us a limited license to store, process, and serve your content for the purpose of providing the Service.
              </p>
              <p>
                The Service and its original content, features, and functionality are owned by twink.forsale and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <div class="bg-yellow-500/10 border-yellow-500/30 rounded-lg border p-3">
                <p><strong>DMCA Compliance:</strong> We respond to valid DMCA takedown notices. See our <a href="/dmca" class="text-theme-accent-primary hover:underline">DMCA Policy</a> for more information.</p>
              </div>
            </div>
          </section>

          {/* Privacy and Data */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Shield class="h-5 w-5" />
              Privacy and Data Protection
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                Your privacy is important to us. Please review our <a href="/privacy" class="text-theme-accent-primary hover:underline">Privacy Policy</a>, which also governs your use of the Service, to understand our practices.
              </p>
              <ul class="space-y-2 list-disc list-inside">
                <li>We collect minimal personal information necessary for service operation</li>
                <li>Files and data may be analyzed for security and compliance purposes</li>
                <li>We may share information as required by law or court order</li>
                <li>You can request account deletion at any time</li>
              </ul>
            </div>
          </section>

          {/* Service Availability */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Globe class="h-5 w-5" />
              Service Availability and Modifications
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
              <ul class="space-y-2 list-disc list-inside">
                <li>Service may be temporarily unavailable due to maintenance</li>
                <li>Features may be added, modified, or removed</li>
                <li>We may impose usage limits or restrictions</li>
                <li>API access may be limited or revoked</li>
              </ul>
            </div>
          </section>

          {/* Disclaimers and Limitations */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle class="h-5 w-5" />
              Disclaimers and Limitation of Liability
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <div class="bg-red-500/10 border-red-500/30 rounded-lg border p-4">
                <p class="font-semibold mb-2">IMPORTANT LEGAL DISCLAIMERS:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
                  <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED</li>
                  <li>WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE</li>
                  <li>USE OF THE SERVICE IS AT YOUR OWN RISK</li>
                </ul>
              </div>
              <p>
                In no event shall twink.forsale be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle class="h-5 w-5" />
              Account Termination
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including:</p>
              <ul class="space-y-2 list-disc list-inside">
                <li>Violation of these Terms of Service</li>
                <li>Uploading prohibited content</li>
                <li>Suspected fraudulent or abusive behavior</li>
                <li>Legal compliance requirements</li>
                <li>At our sole discretion</li>
              </ul>
              <p>
                Upon termination, your right to use the Service will cease immediately. All provisions of these Terms which should survive termination shall survive.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Scale class="h-5 w-5" />
              Governing Law and Dispute Resolution
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States and the State of [Your State], without regard to conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration or in the courts of [Your Jurisdiction].
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Changes to Terms
            </h2>
            <div class="text-theme-text-secondary text-sm leading-relaxed">
              <p>
                We reserve the right to update these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Contact Information
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div class="border-theme-card-border rounded-lg border p-4">
                <ul class="space-y-2">
                  <li>• <strong>Discord:</strong> @akiradev</li>
                  <li>• <strong>Email:</strong> <a href="mailto:contact@bwmp.dev" class="text-theme-accent-primary hover:underline">contact@bwmp.dev</a></li>
                  <li>• <strong>GitHub:</strong> <a href="https://github.com/LuminescentDev/twinkforsale" class="text-theme-accent-primary hover:underline">Project Repository</a></li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div class="mt-8 text-center">
          <p class="text-theme-text-muted text-xs">
            These terms are effective as of June 28, 2025
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Terms of Service - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Terms of Service for twink.forsale - Legal terms and conditions for using our file hosting service.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ],
};
