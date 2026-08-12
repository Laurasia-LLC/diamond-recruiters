<?php
/**
 * Diamond Recruiters — general and employer enquiries.
 *
 * Same shape as apply.php but with no file upload: employer briefs from
 * /for-employers and general messages from /contact.
 */

declare(strict_types=1);

require __DIR__ . '/_mailer.php';

dr_preflight('fax');

$formType  = dr_field('form_type', 20) === 'employer' ? 'employer' : 'general';
$isEmployer = $formType === 'employer';

$name      = dr_field('name', 120);
$email     = dr_field('email', 200);
$company   = dr_field('company', 160);
$phone     = dr_field('phone', 60);
$role      = dr_field('role', 200);
$territory = dr_field('territory', 200);
$band      = dr_field('band', 120);
$timing    = dr_field('timing', 120);
$message   = dr_field('message', 5000);
$pageUrl   = dr_field('page_url', 400);
$consent   = dr_field('consent', 20);

if ($name === '' || $email === '') {
    dr_respond(false, 'Please fill in every required field.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    dr_respond(false, 'That email address does not look right. Please check it and try again.', 422);
}

if ($isEmployer && ($company === '' || $role === '' || $territory === '')) {
    dr_respond(false, 'Please tell us the company, the role and the territory.', 422);
}

if (!$isEmployer && $message === '') {
    dr_respond(false, 'Please tell us how we can help.', 422);
}

if ($consent === '') {
    dr_respond(false, 'Please confirm you agree to the Privacy Policy so we may reply.', 422);
}

$subject = $isEmployer
    ? sprintf('[Brief] %s — %s (%s)', $role !== '' ? $role : 'Role', $company, $territory)
    : sprintf('[Enquiry] %s', dr_header_safe($name));

$lines = array_filter([
    $isEmployer
        ? 'New hiring brief from the Diamond Recruiters website.'
        : 'New enquiry from the Diamond Recruiters website.',
    '',
    'CONTACT',
    '  Name:      ' . $name,
    '  Email:     ' . $email,
    $company !== '' ? '  Company:   ' . $company : null,
    '  Phone:     ' . ($phone !== '' ? $phone : '—'),
    $isEmployer ? '' : null,
    $isEmployer ? 'THE ROLE' : null,
    $isEmployer ? '  Role:      ' . $role : null,
    $isEmployer ? '  Territory: ' . $territory : null,
    $isEmployer ? '  Band:      ' . ($band !== '' ? $band : 'not stated') : null,
    $isEmployer ? '  Timing:    ' . ($timing !== '' ? $timing : 'not stated') : null,
    '',
    $isEmployer ? 'WHAT GOOD LOOKS LIKE' : 'MESSAGE',
    '  ' . ($message !== '' ? str_replace("\n", "\n  ", $message) : '—'),
    '',
    '---',
    $pageUrl !== '' ? 'Sent from ' . $pageUrl : null,
    'Submitted ' . gmdate('Y-m-d H:i:s') . ' UTC from ' . dr_client_ip(),
    'Consent to the Privacy Policy was given at submission.',
], static fn($line) => $line !== null);

if (!dr_send($subject, implode("\n", $lines), $name, $email)) {
    error_log('contact.php: delivery failed for ' . dr_header_safe($email));
    dr_respond(false, 'We could not send that just now. Please email us directly and we will pick it up.', 502);
}

dr_respond(true, '', 200);
