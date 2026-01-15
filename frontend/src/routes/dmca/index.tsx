import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Shield, AlertTriangle, FileText, Mail, Scale } from "lucide-icons-qwik";

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
              DMCA Policy
            </h1>
            <p class="text-theme-text-secondary">
              Digital Millennium Copyright Act compliance and takedown procedures
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
              DMCA Compliance Statement
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                twink.forsale respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement committed using our service.
              </p>
              <p>
                If you are a copyright owner or an agent thereof and believe that any content hosted on our service infringes your copyrights, you may submit a takedown notice pursuant to the DMCA.
              </p>
              <div class="bg-blue-500/10 border-blue-500/30 rounded-lg border p-3">
                <p><strong>Safe Harbor:</strong> We qualify for DMCA safe harbor protections under 17 U.S.C. § 512 as a service provider that hosts user-generated content.</p>
              </div>
            </div>
          </section>

          {/* DMCA Takedown Notice */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <AlertTriangle class="h-5 w-5" />
              Filing a DMCA Takedown Notice
            </h2>
            <div class="space-y-4">
              <div class="text-theme-text-secondary text-sm leading-relaxed">
                <p class="mb-4">To file a valid DMCA takedown notice, please provide the following information:</p>
              </div>

              <div class="bg-yellow-500/10 border-yellow-500/30 rounded-lg border p-4">
                <h3 class="text-yellow-600 mb-3 font-semibold">Required Elements (17 U.S.C. § 512(c)(3)):</h3>
                <ol class="text-theme-text-secondary space-y-2 text-sm list-decimal list-inside">
                  <li><strong>Physical or electronic signature</strong> of the copyright owner or authorized agent</li>
                  <li><strong>Identification of the copyrighted work</strong> claimed to have been infringed</li>
                  <li><strong>Identification of the infringing material</strong> and its location on our service (provide the full URL)</li>
                  <li><strong>Your contact information</strong> including name, address, telephone number, and email address</li>
                  <li><strong>A statement of good faith belief</strong> that the use is not authorized by the copyright owner</li>
                  <li><strong>A statement of accuracy</strong> and declaration under penalty of perjury that you are authorized to act</li>
                </ol>
              </div>

              <div class="bg-red-500/10 border-red-500/30 rounded-lg border p-4">
                <h3 class="text-red-400 mb-2 font-semibold">Important Notice:</h3>
                <p class="text-theme-text-secondary text-sm">
                  <strong>False claims may result in liability for damages including costs and attorney fees.</strong> Only submit a DMCA notice if you are the copyright owner or authorized to act on behalf of the owner.
                </p>
              </div>
            </div>
          </section>

          {/* Sample DMCA Notice */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <FileText class="h-5 w-5" />
              Sample DMCA Notice Template
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>You may use the following template for your DMCA takedown notice:</p>
              
              <div class="bg-gray-500/10 border-gray-500/30 rounded-lg border p-4 font-mono text-xs">
                <pre class="whitespace-pre-wrap">
To: DMCA Agent, twink.forsale
Email: dmca@bwmp.dev

DMCA Takedown Notice

I, [Your Full Name], am the owner of certain intellectual property rights in the work described below.

1. Identification of copyrighted work:
   [Describe the copyrighted work, e.g., "Photography titled 'Sunset Beach' taken on [date]"]

2. Identification of infringing material:
   The following URL(s) contain infringing material:
   - https://twink.forsale/f/[shortcode]
   - [Additional URLs if applicable]

3. Contact Information:
   Name: [Your Full Name]
   Address: [Your Full Address]
   Phone: [Your Phone Number]
   Email: [Your Email Address]

4. Good Faith Statement:
   I have a good faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law.

5. Accuracy Statement:
   I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Signature: [Physical or Electronic Signature]
Date: [Date]
                </pre>
              </div>
            </div>
          </section>

          {/* How to Submit */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Mail class="h-5 w-5" />
              How to Submit Your Notice
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>Submit your DMCA takedown notice to our designated copyright agent:</p>
              
              <div class="border-theme-card-border rounded-lg border p-4">
                <h3 class="text-theme-text-primary mb-2 font-semibold">DMCA Designated Agent:</h3>
                <ul class="space-y-1">
                  <li><strong>Name:</strong> DMCA Agent</li>
                  <li><strong>Email:</strong> <a href="mailto:dmca@bwmp.dev" class="text-theme-accent-primary hover:underline">dmca@bwmp.dev</a></li>
                  <li><strong>Address:</strong> [Your Business Address]</li>
                </ul>
              </div>

              <div class="bg-blue-500/10 border-blue-500/30 rounded-lg border p-3">
                <p><strong>Response Time:</strong> We will review and respond to valid DMCA notices within 24-48 hours during business days.</p>
              </div>
            </div>
          </section>

          {/* Our Response Process */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Shield class="h-5 w-5" />
              Our Response Process
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>Upon receiving a valid DMCA takedown notice, we will:</p>
              <ol class="space-y-2 list-decimal list-inside">
                <li>Expeditiously remove or disable access to the allegedly infringing material</li>
                <li>Notify the user who uploaded the content about the removal</li>
                <li>Provide the user with a copy of the takedown notice</li>
                <li>Inform the user of their right to file a counter-notice</li>
                <li>Implement appropriate penalties for repeat infringers</li>
              </ol>
              
              <div class="bg-green-500/10 border-green-500/30 rounded-lg border p-3">
                <p><strong>Repeat Infringer Policy:</strong> We will terminate accounts of users who are found to be repeat infringers in accordance with the DMCA.</p>
              </div>
            </div>
          </section>

          {/* Counter-Notice */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <Scale class="h-5 w-5" />
              Counter-Notice Procedure
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you believe your content was removed in error, you may file a counter-notice under Section 512(g) of the DMCA.
              </p>
              
              <div class="bg-blue-500/10 border-blue-500/30 rounded-lg border p-4">
                <h3 class="text-blue-400 mb-2 font-semibold">Counter-Notice Requirements:</h3>
                <ol class="space-y-2 list-decimal list-inside">
                  <li>Your physical or electronic signature</li>
                  <li>Identification of the material removed and its previous location</li>
                  <li>A statement under penalty of perjury that you have a good faith belief the material was removed due to mistake or misidentification</li>
                  <li>Your contact information</li>
                  <li>A statement consenting to federal court jurisdiction</li>
                </ol>
              </div>

              <p>
                Send counter-notices to the same email address: <a href="mailto:dmca@bwmp.dev" class="text-theme-accent-primary hover:underline">dmca@bwmp.dev</a>
              </p>
              
              <div class="bg-yellow-500/10 border-yellow-500/30 rounded-lg border p-3">
                <p><strong>Restoration:</strong> If we receive a valid counter-notice and the original complainant doesn't file a court action within 10 business days, we may restore the content.</p>
              </div>
            </div>
          </section>

          {/* Fair Use */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 flex items-center gap-2 text-xl font-bold">
              <FileText class="h-5 w-5" />
              Fair Use and False Claims
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <div class="bg-orange-500/10 border-orange-500/30 rounded-lg border p-4">
                <h3 class="text-orange-400 mb-2 font-semibold">Before Filing a DMCA Notice:</h3>
                <ul class="space-y-2 list-disc list-inside">
                  <li>Consider whether the use might qualify as fair use under U.S. copyright law</li>
                  <li>Ensure you actually own the copyright or are authorized to act</li>
                  <li>Verify that the use is not licensed or otherwise authorized</li>
                  <li>Remember that false claims can result in legal liability</li>
                </ul>
              </div>
              
              <p>
                <strong>Section 512(f) Liability:</strong> Any person who knowingly materially misrepresents that material is infringing may be liable for damages, including costs and attorney fees.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section class="card-cute rounded-2xl p-6">
            <h2 class="text-theme-text-primary mb-4 text-lg font-bold">
              Questions About This Policy
            </h2>
            <div class="text-theme-text-secondary space-y-4 text-sm leading-relaxed">
              <p>
                If you have questions about our DMCA policy or procedures, please contact us:
              </p>
              <div class="border-theme-card-border rounded-lg border p-4">
                <ul class="space-y-2">
                  <li>• <strong>DMCA Agent:</strong> <a href="mailto:dmca@bwmp.dev" class="text-theme-accent-primary hover:underline">dmca@bwmp.dev</a></li>
                  <li>• <strong>General Contact:</strong> <a href="mailto:contact@bwmp.dev" class="text-theme-accent-primary hover:underline">contact@bwmp.dev</a></li>
                  <li>• <strong>Discord:</strong> @akiradev</li>
                </ul>
              </div>
              <p class="text-theme-text-muted">
                This policy is designed to comply with the DMCA while protecting the rights of both copyright owners and our users.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div class="mt-8 text-center">
          <p class="text-theme-text-muted text-xs">
            This DMCA policy is effective as of June 28, 2025
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "DMCA Policy - twink.forsale",
  meta: [
    {
      name: "description",
      content: "DMCA Policy for twink.forsale - Copyright infringement reporting and takedown procedures.",
    },
    {
      name: "robots",
      content: "index, follow",
    },
  ],
};
