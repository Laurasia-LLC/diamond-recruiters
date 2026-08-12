<?php
/**
 * Copy this file to config.php ON THE SERVER and fill it in.
 *
 * config.php is deliberately NOT in the git repo and is excluded from the
 * deploy sync, so your mail password never touches GitHub and is never
 * overwritten by a deployment.
 *
 * If you skip this entirely, apply.php falls back to PHP mail(), which works
 * on all-inkl for addresses on your own domain. Configure SMTP below only if
 * you see deliverability problems.
 */

return [
    // Where applications are delivered. Add more addresses to CC the team.
    'to' => ['apply@diamond-recruiters.com'],

    // Envelope sender. MUST be an address on your own domain or SPF will fail.
    'from_email' => 'apply@diamond-recruiters.com',
    'from_name'  => 'Diamond Recruiters Website',

    // Where the no-JS fallback redirects after a successful submission.
    'success_url' => '/thank-you',

    // --- Optional authenticated SMTP -------------------------------------
    // Leave 'smtp_host' empty to use PHP mail() instead.
    // all-inkl SMTP host looks like: w01abcde.kasserver.com
    'smtp_host' => '',
    'smtp_port' => 587,        // 587 = STARTTLS, 465 = implicit TLS
    'smtp_user' => '',
    'smtp_pass' => '',
];
