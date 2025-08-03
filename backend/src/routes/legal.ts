import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function legalRoutes(fastify: FastifyInstance) {
  // Privacy Policy
  fastify.get('/legal/privacy', async (request: FastifyRequest, reply: FastifyReply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - CodeWRX DropshipAgent</title>
    <link rel="stylesheet" href="/public/legal.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Privacy Policy</h1>
            <p class="last-updated">Last updated: ${new Date().toLocaleDateString()}</p>
        </header>
        
        <main>
            <section>
                <h2>1. Information We Collect</h2>
                <p>CodeWRX DropshipAgent CSV Ingestion service processes order data from your e-commerce exports. We collect:</p>
                <ul>
                    <li>Order information (order numbers, dates, amounts)</li>
                    <li>Customer data (names, emails, addresses) - only from CSV files you provide</li>
                    <li>Product information (names, SKUs, prices)</li>
                    <li>System logs and processing statistics</li>
                </ul>
            </section>

            <section>
                <h2>2. How We Use Your Information</h2>
                <p>We use the collected information solely for:</p>
                <ul>
                    <li>Processing and organizing your order data</li>
                    <li>Providing dashboard analytics and reporting</li>
                    <li>System monitoring and error reporting</li>
                    <li>Preparing data for integration with DropshipAgent platform</li>
                </ul>
            </section>

            <section>
                <h2>3. Data Storage and Security</h2>
                <p>Your data is stored securely:</p>
                <ul>
                    <li>All data is stored in encrypted PostgreSQL database</li>
                    <li>Access is protected by authentication and authorization</li>
                    <li>Regular backups are maintained</li>
                    <li>Data is retained only as long as necessary for service provision</li>
                </ul>
            </section>

            <section>
                <h2>4. Data Sharing</h2>
                <p>We do not share, sell, or rent your personal information to third parties. Data is only:</p>
                <ul>
                    <li>Processed internally for service provision</li>
                    <li>Prepared for integration with approved DropshipAgent platform</li>
                    <li>Shared with you through the dashboard interface</li>
                </ul>
            </section>

            <section>
                <h2>5. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your data through the dashboard</li>
                    <li>Request data deletion</li>
                    <li>Export your data</li>
                    <li>Correct inaccurate information</li>
                </ul>
            </section>

            <section>
                <h2>6. Contact Information</h2>
                <p>For privacy-related inquiries, contact:</p>
                <p>Email: <a href="mailto:privacy@dropshipagent.com">privacy@dropshipagent.com</a></p>
                <p>Address: CodeWRX DropshipAgent, [Your Business Address]</p>
            </section>
        </main>
    </div>
</body>
</html>`;
    
    reply.type('text/html').send(html);
  });

  // Terms of Service
  fastify.get('/legal/terms', async (request: FastifyRequest, reply: FastifyReply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - CodeWRX DropshipAgent</title>
    <link rel="stylesheet" href="/public/legal.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Terms of Service</h1>
            <p class="last-updated">Last updated: ${new Date().toLocaleDateString()}</p>
        </header>
        
        <main>
            <section>
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using the CodeWRX DropshipAgent CSV Ingestion service, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            </section>

            <section>
                <h2>2. Service Description</h2>
                <p>Our service provides:</p>
                <ul>
                    <li>Automated CSV file processing and ingestion</li>
                    <li>Order data organization and analytics</li>
                    <li>Dashboard interface for data monitoring</li>
                    <li>Data preparation for DropshipAgent integration</li>
                </ul>
            </section>

            <section>
                <h2>3. User Responsibilities</h2>
                <p>You are responsible for:</p>
                <ul>
                    <li>Providing accurate and lawful data</li>
                    <li>Maintaining the security of your access credentials</li>
                    <li>Ensuring you have rights to process the customer data in CSV files</li>
                    <li>Complying with applicable data protection laws</li>
                </ul>
            </section>

            <section>
                <h2>4. Data Processing Agreement</h2>
                <p>By using this service, you acknowledge that:</p>
                <ul>
                    <li>We act as a data processor for your e-commerce data</li>
                    <li>You remain the data controller for customer information</li>
                    <li>Processing is limited to the services described herein</li>
                    <li>Data will be handled in accordance with our Privacy Policy</li>
                </ul>
            </section>

            <section>
                <h2>5. Service Limitations</h2>
                <p>This service is provided "as is" and:</p>
                <ul>
                    <li>We do not guarantee 100% uptime</li>
                    <li>Data processing accuracy depends on CSV file quality</li>
                    <li>Service may be interrupted for maintenance</li>
                    <li>We reserve the right to modify features</li>
                </ul>
            </section>

            <section>
                <h2>6. Limitation of Liability</h2>
                <p>CodeWRX DropshipAgent shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of this service.</p>
            </section>

            <section>
                <h2>7. Termination</h2>
                <p>Either party may terminate service access at any time. Upon termination, we will securely delete your data within 30 days unless otherwise required by law.</p>
            </section>

            <section>
                <h2>8. Contact Information</h2>
                <p>For questions about these terms:</p>
                <p>Email: <a href="mailto:legal@dropshipagent.com">legal@dropshipagent.com</a></p>
                <p>Address: CodeWRX DropshipAgent, [Your Business Address]</p>
            </section>
        </main>
    </div>
</body>
</html>`;
    
    reply.type('text/html').send(html);
  });

  // Data Processing Agreement
  fastify.get('/legal/dpa', async (request: FastifyRequest, reply: FastifyReply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Processing Agreement - CodeWRX DropshipAgent</title>
    <link rel="stylesheet" href="/public/legal.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Data Processing Agreement</h1>
            <p class="last-updated">Last updated: ${new Date().toLocaleDateString()}</p>
        </header>
        
        <main>
            <section>
                <h2>1. Definitions</h2>
                <ul>
                    <li><strong>Controller:</strong> You, the user of the CSV Ingestion service</li>
                    <li><strong>Processor:</strong> CodeWRX DropshipAgent</li>
                    <li><strong>Personal Data:</strong> Customer information contained in CSV files</li>
                    <li><strong>Processing:</strong> Any operation performed on personal data</li>
                </ul>
            </section>

            <section>
                <h2>2. Nature and Purpose of Processing</h2>
                <p>We process personal data solely for:</p>
                <ul>
                    <li>Ingesting and organizing order data from CSV exports</li>
                    <li>Providing analytics and reporting services</li>
                    <li>Preparing data for integration with DropshipAgent platform</li>
                    <li>System monitoring and error reporting</li>
                </ul>
            </section>

            <section>
                <h2>3. Categories of Data</h2>
                <p>We may process the following categories of personal data:</p>
                <ul>
                    <li>Customer names and contact information</li>
                    <li>Billing and shipping addresses</li>
                    <li>Order history and purchase behavior</li>
                    <li>Payment information (anonymized)</li>
                </ul>
            </section>

            <section>
                <h2>4. Categories of Data Subjects</h2>
                <p>Personal data concerns the following categories of data subjects:</p>
                <ul>
                    <li>Your e-commerce customers</li>
                    <li>End users of your services</li>
                </ul>
            </section>

            <section>
                <h2>5. Technical and Organizational Measures</h2>
                <p>We implement the following security measures:</p>
                <ul>
                    <li>Encryption of data at rest and in transit</li>
                    <li>Access controls and authentication</li>
                    <li>Regular security updates and monitoring</li>
                    <li>Secure backup and recovery procedures</li>
                    <li>Staff training on data protection</li>
                </ul>
            </section>

            <section>
                <h2>6. Sub-processors</h2>
                <p>We may engage the following sub-processors:</p>
                <ul>
                    <li>Cloud hosting providers (with appropriate safeguards)</li>
                    <li>Database management services</li>
                    <li>Security monitoring services</li>
                </ul>
                <p>You will be notified of any changes to sub-processors.</p>
            </section>

            <section>
                <h2>7. Data Subject Rights</h2>
                <p>We will assist you in fulfilling data subject rights requests, including:</p>
                <ul>
                    <li>Right of access</li>
                    <li>Right to rectification</li>
                    <li>Right to erasure</li>
                    <li>Right to restrict processing</li>
                    <li>Right to data portability</li>
                </ul>
            </section>

            <section>
                <h2>8. Data Retention</h2>
                <p>Personal data will be:</p>
                <ul>
                    <li>Retained only as long as necessary for service provision</li>
                    <li>Deleted within 30 days of service termination</li>
                    <li>Anonymized for analytics purposes where permitted</li>
                </ul>
            </section>

            <section>
                <h2>9. International Transfers</h2>
                <p>If data is transferred outside the EEA, we ensure:</p>
                <ul>
                    <li>Adequate level of protection</li>
                    <li>Appropriate safeguards (Standard Contractual Clauses)</li>
                    <li>Compliance with applicable data protection laws</li>
                </ul>
            </section>

            <section>
                <h2>10. Breach Notification</h2>
                <p>In case of a personal data breach, we will:</p>
                <ul>
                    <li>Notify you without undue delay</li>
                    <li>Provide all relevant information about the breach</li>
                    <li>Assist in breach notification to authorities if required</li>
                    <li>Implement measures to mitigate adverse effects</li>
                </ul>
            </section>

            <section>
                <h2>11. Contact Information</h2>
                <p>For DPA-related inquiries:</p>
                <p>Email: <a href="mailto:dpo@dropshipagent.com">dpo@dropshipagent.com</a></p>
                <p>Address: CodeWRX DropshipAgent, [Your Business Address]</p>
            </section>
        </main>
    </div>
</body>
</html>`;
    
    reply.type('text/html').send(html);
  });
}