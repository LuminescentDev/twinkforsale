import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Shield, AlertTriangle, CheckCircle, CircleX } from "lucide-icons-qwik";

export default component$(() => {
  return (
    <div class="bg-theme-bg-primary min-h-screen p-4 sm:p-6">
      <div class="mx-auto max-w-4xl">
        {/* Header */}
        <div class="mb-8">
          <div class="card-cute rounded-3xl p-6 text-center">
            <div class="mb-4 flex justify-center">
              <div class="from-theme-accent-primary to-theme-accent-secondary rounded-full bg-gradient-to-br p-3">
                <Shield class="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 class="text-gradient-cute mb-2 text-3xl font-bold">
              Acceptable Use Policy
            </h1>
            <p class="text-theme-text-secondary">
              Guidelines for appropriate use of twink.forsale services
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
              <Shield class="h-5 w-5" />
              Our Commitment to Safe Hosting
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                twink.forsale is committed to providing a safe, reliable, and
                legal file hosting service. This Acceptable Use Policy outlines
                what content and activities are permitted on our platform.
              </p>
              <p>
                By using our service, you agree to comply with these guidelines.
                Violations may result in content removal, account suspension, or
                termination of service.
              </p>
            </div>
          </section>

          {/* Prohibited Content */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <CircleX class="h-5 w-5 text-red-500" />
              Prohibited Content and Activities
            </h2>
            <div class="space-y-4">
              <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <h3 class="mb-3 font-semibold text-red-400">
                  Content You May NOT Upload:
                </h3>
                <ul class="text-theme-text-secondary list-inside list-disc space-y-2 text-sm">
                  <li>
                    <strong>Illegal Content:</strong> Content that violates
                    local, state, federal, or international laws
                  </li>
                  <li>
                    <strong>Copyrighted Material:</strong> Content that
                    infringes on intellectual property rights without permission
                  </li>
                  <li>
                    <strong>Adult Content:</strong> Pornography, sexually
                    explicit material, or nudity
                  </li>
                  <li>
                    <strong>Child Exploitation:</strong> Any content involving
                    minors in inappropriate contexts (zero tolerance)
                  </li>
                  <li>
                    <strong>Graphic Violence:</strong> Gore, graphic depictions
                    of violence, death, or severe injury
                  </li>
                  <li>
                    <strong>Animal Abuse:</strong> Content depicting cruelty,
                    abuse, or violence against animals
                  </li>
                  <li>
                    <strong>Extreme Content:</strong> Shocking, disturbing, or
                    gratuitously violent imagery
                  </li>
                  <li>
                    <strong>Malware:</strong> Viruses, trojans, ransomware, or
                    other malicious software
                  </li>
                  <li>
                    <strong>Hate Content:</strong> Content promoting violence,
                    hatred, or discrimination against individuals or groups
                  </li>
                  <li>
                    <strong>Harassment:</strong> Content intended to harass,
                    threaten, or intimidate others
                  </li>
                  <li>
                    <strong>Spam:</strong> Unsolicited bulk content or automated
                    uploads
                  </li>
                  <li>
                    <strong>Phishing:</strong> Content designed to steal
                    personal information or credentials
                  </li>
                  <li>
                    <strong>Doxxing:</strong> Personal information shared
                    without consent
                  </li>
                  <li>
                    <strong>Terrorism:</strong> Content that promotes or
                    facilitates terrorist activities
                  </li>
                  <li>
                    <strong>Self-Harm:</strong> Content promoting suicide,
                    self-injury, or eating disorders
                  </li>
                  <li>
                    <strong>Drug-Related:</strong> Content promoting illegal
                    drug use, sales, or distribution
                  </li>
                  <li>
                    <strong>Weapons Trading:</strong> Content facilitating
                    illegal weapons sales or bomb-making instructions
                  </li>
                </ul>
              </div>

              <div class="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                <h3 class="mb-3 font-semibold text-orange-400">
                  Prohibited Activities:
                </h3>
                <ul class="text-theme-text-secondary list-inside list-disc space-y-2 text-sm">
                  <li>
                    Using our service for commercial file distribution without
                    permission
                  </li>
                  <li>
                    Attempting to bypass our security measures or access
                    controls
                  </li>
                  <li>Automated scraping or bulk downloading of content</li>
                  <li>
                    Using our service to host files for other websites or
                    services
                  </li>
                  <li>Creating multiple accounts to circumvent limits</li>
                  <li>Sharing account credentials with others</li>
                  <li>Reverse engineering our software or systems</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Content */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <CheckCircle class="h-5 w-5 text-green-500" />
              Acceptable Content and Use
            </h2>
            <div class="space-y-4">
              <div class="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <h3 class="mb-3 font-semibold text-green-400">
                  Content You MAY Upload:
                </h3>
                <ul class="text-theme-text-secondary list-inside list-disc space-y-2 text-sm">
                  <li>
                    <strong>Personal Files:</strong> Screenshots, photos,
                    documents for personal use
                  </li>
                  <li>
                    <strong>Original Content:</strong> Files you created or own
                    the rights to
                  </li>
                  <li>
                    <strong>Licensed Content:</strong> Content you have
                    permission to share
                  </li>
                  <li>
                    <strong>Educational Material:</strong> Non-commercial
                    educational resources
                  </li>
                  <li>
                    <strong>Open Source:</strong> Code, software, and resources
                    with appropriate licenses
                  </li>
                  <li>
                    <strong>Creative Works:</strong> Art, music, writing (with
                    proper rights)
                  </li>
                  <li>
                    <strong>Collaboration:</strong> Files for legitimate
                    collaborative projects
                  </li>
                </ul>
              </div>

              <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <h3 class="mb-3 font-semibold text-blue-400">
                  Appropriate Use Cases:
                </h3>
                <ul class="text-theme-text-secondary list-inside list-disc space-y-2 text-sm">
                  <li>ShareX integration for screenshot sharing</li>
                  <li>File sharing for personal or professional projects</li>
                  <li>Temporary file storage and sharing</li>
                  <li>Portfolio hosting (with proper content)</li>
                  <li>Academic project collaboration</li>
                  <li>Software development asset sharing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Enforcement */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle class="h-5 w-5" />
              Enforcement and Consequences
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                We take violations of this policy seriously and will take
                appropriate action:
              </p>

              <div class="space-y-3">
                <div class="border-theme-card-border rounded-lg border p-3">
                  <h4 class="text-theme-text-primary mb-2 font-medium">
                    Content Removal
                  </h4>
                  <p class="text-sm">
                    Prohibited content will be removed immediately upon
                    detection or report.
                  </p>
                </div>

                <div class="border-theme-card-border rounded-lg border p-3">
                  <h4 class="text-theme-text-primary mb-2 font-medium">
                    Account Warnings
                  </h4>
                  <p class="text-sm">
                    First-time violations may result in a warning and
                    educational guidance.
                  </p>
                </div>

                <div class="border-theme-card-border rounded-lg border p-3">
                  <h4 class="text-theme-text-primary mb-2 font-medium">
                    Account Suspension
                  </h4>
                  <p class="text-sm">
                    Repeated violations or serious offenses may result in
                    temporary account suspension.
                  </p>
                </div>

                <div class="border-theme-card-border rounded-lg border p-3">
                  <h4 class="text-theme-text-primary mb-2 font-medium">
                    Account Termination
                  </h4>
                  <p class="text-sm">
                    Severe violations or continued non-compliance will result in
                    permanent account termination.
                  </p>
                </div>

                <div class="border-theme-card-border rounded-lg border p-3">
                  <h4 class="text-theme-text-primary mb-2 font-medium">
                    Legal Action
                  </h4>
                  <p class="text-sm">
                    Illegal content may be reported to appropriate law
                    enforcement authorities.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle class="h-5 w-5" />
              Reporting Violations
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you encounter content that violates this policy, please
                report it to us:
              </p>

              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">
                  How to Report:
                </h3>
                <ul class="list-inside list-disc space-y-2">
                  <li>
                    <strong>General Reports:</strong>{" "}
                    <a
                      href="mailto:abuse@bwmp.dev"
                      class="text-theme-accent-primary hover:underline"
                    >
                      abuse@bwmp.dev
                    </a>
                  </li>
                  <li>
                    <strong>Copyright Issues:</strong>{" "}
                    <a
                      href="mailto:dmca@bwmp.dev"
                      class="text-theme-accent-primary hover:underline"
                    >
                      dmca@bwmp.dev
                    </a>
                  </li>
                  <li>
                    <strong>Security Issues:</strong>{" "}
                    <a
                      href="mailto:security@bwmp.dev"
                      class="text-theme-accent-primary hover:underline"
                    >
                      security@bwmp.dev
                    </a>
                  </li>
                  <li>
                    <strong>Urgent/Illegal Content:</strong>{" "}
                    <a
                      href="mailto:contact@bwmp.dev"
                      class="text-theme-accent-primary hover:underline"
                    >
                      contact@bwmp.dev
                    </a>
                  </li>
                </ul>
              </div>

              <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <p>
                  <strong>Include in your report:</strong> The file URL,
                  description of the violation, and any relevant context. We
                  will investigate all reports promptly.
                </p>
              </div>
            </div>
          </section>

          {/* Content Monitoring */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Shield class="h-5 w-5" />
              Content Monitoring and Privacy
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                We employ various methods to ensure compliance with this policy:
              </p>

              <ul class="list-inside list-disc space-y-2">
                <li>
                  <strong>Automated Scanning:</strong> Basic automated checks
                  for known harmful content
                </li>
                <li>
                  <strong>User Reports:</strong> Community reporting of
                  inappropriate content
                </li>
                <li>
                  <strong>Manual Review:</strong> Human review of reported or
                  flagged content
                </li>
                <li>
                  <strong>Random Audits:</strong> Periodic sampling of uploaded
                  content for compliance
                </li>
              </ul>

              <div class="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <p>
                  <strong>Privacy Note:</strong> We respect your privacy and
                  only access your files when necessary for security, legal
                  compliance, or investigating reports. See our{" "}
                  <a
                    href="/privacy"
                    class="text-theme-accent-primary hover:underline"
                  >
                    Privacy Policy
                  </a>{" "}
                  for more details.
                </p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Policy Updates
            </h2>
            <div class="text-theme-text-secondary text-sm leading-relaxed">
              <p>
                We may update this Acceptable Use Policy to reflect changes in
                laws, technology, or our service. Users will be notified of
                significant changes via email or platform notifications.
              </p>
              <p class="mt-3">
                Continued use of our service after policy updates constitutes
                acceptance of the new terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Questions or Concerns
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you have questions about this policy or need clarification on
                what constitutes acceptable use:
              </p>
              <div class="border-theme-card-border rounded-lg border p-4">
                <ul class="space-y-2">
                  <li>
                    • <strong>Email:</strong>{" "}
                    <a
                      href="mailto:contact@bwmp.dev"
                      class="text-theme-accent-primary hover:underline"
                    >
                      contact@bwmp.dev
                    </a>
                  </li>
                  <li>
                    • <strong>Discord:</strong> @akiradev
                  </li>
                  <li>
                    • <strong>Review:</strong>{" "}
                    <a
                      href="/terms"
                      class="text-theme-accent-primary hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      class="text-theme-accent-primary hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div class="mt-8 text-center">
          <p class="text-theme-text-muted text-xs">
            This Acceptable Use Policy is effective as of June 28, 2025
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Acceptable Use Policy - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Acceptable Use Policy for twink.forsale - Guidelines for appropriate use of our file hosting service.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ],
};
