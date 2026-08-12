<?php
/**
 * Diamond Recruiters — application intake.
 *
 * Accepts a multipart/form-data POST from the site's application form,
 * validates it, and emails it to the recruitment inbox with the resume
 * attached. The uploaded file is never written into the web root.
 *
 * Responds with JSON when the client asks for it (the enhanced form does) and
 * falls back to a redirect so the form still works without JavaScript.
 */

declare(strict_types=1);

require __DIR__ . '/_mailer.php';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'rtf', 'odt'];
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/zip',          // some servers report .docx as a zip container
    'application/octet-stream', // and some browsers send this
];

dr_preflight('website');

// -------------------------------------------------------------------------
// Text fields
// -------------------------------------------------------------------------

$name      = dr_field('name', 120);
$email     = dr_field('email', 200);
$phone     = dr_field('phone', 60);
$city      = dr_field('base_city', 120);
$ote       = dr_field('ote_expectation', 80);
$travel    = dr_field('travel', 120);
$linkedin  = dr_field('linkedin', 300);
$message   = dr_field('message', 5000);
$roleTitle = dr_field('role_title', 200);
$roleSlug  = dr_field('role_slug', 200);
$pageUrl   = dr_field('page_url', 400);
$consent   = dr_field('consent', 20);

if ($name === '' || $email === '' || $city === '' || $ote === '' || $travel === '') {
    dr_respond(false, 'Please fill in every required field.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    dr_respond(false, 'That email address does not look right. Please check it and try again.', 422);
}

if ($consent === '') {
    dr_respond(false, 'Please confirm you agree to the Privacy Policy so we may consider you for roles.', 422);
}

// -------------------------------------------------------------------------
// Resume upload
// -------------------------------------------------------------------------

$upload = $_FILES['resume'] ?? null;

if (!is_array($upload) || (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    dr_respond(false, 'Please attach your resume.', 422);
}

if ((int) $upload['error'] !== UPLOAD_ERR_OK) {
    $tooBig = in_array((int) $upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
    dr_respond(
        false,
        $tooBig ? 'That file is too large. The limit is 8 MB.' : 'The upload did not complete. Please try again.',
        422
    );
}

if (!is_uploaded_file((string) $upload['tmp_name'])) {
    dr_respond(false, 'The upload could not be verified.', 400);
}

$size = (int) ($upload['size'] ?? 0);
if ($size <= 0 || $size > MAX_UPLOAD_BYTES) {
    dr_respond(false, 'That file is too large. The limit is 8 MB.', 422);
}

$extension = strtolower(pathinfo((string) ($upload['name'] ?? 'resume'), PATHINFO_EXTENSION));
if (!in_array($extension, ALLOWED_EXTENSIONS, true)) {
    dr_respond(false, 'Please attach a PDF, DOC or DOCX file.', 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$detectedMime = (string) $finfo->file((string) $upload['tmp_name']);

if (!in_array($detectedMime, ALLOWED_MIME_TYPES, true)) {
    dr_respond(false, 'That file type is not accepted. Please attach a PDF, DOC or DOCX.', 422);
}

$fileContents = file_get_contents((string) $upload['tmp_name']);
if ($fileContents === false) {
    dr_respond(false, 'We could not read that file. Please try again.', 500);
}

// Rebuild a safe filename from the candidate's name — never trust the client's.
$slug = trim((string) preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-');
$attachmentName = ($slug !== '' ? $slug : 'candidate') . '-resume.' . $extension;

// -------------------------------------------------------------------------
// Compose and send
// -------------------------------------------------------------------------

$subject = sprintf(
    '[Application] %s — %s',
    $roleTitle !== '' ? $roleTitle : 'General application',
    dr_header_safe($name)
);

$lines = array_filter([
    'New application from the Diamond Recruiters website.',
    '',
    'ROLE',
    '  ' . ($roleTitle !== '' ? $roleTitle : 'General / no specific role'),
    $roleSlug !== '' ? '  Slug: ' . $roleSlug : null,
    $pageUrl !== '' ? '  Page: ' . $pageUrl : null,
    '',
    'CANDIDATE',
    '  Name:            ' . $name,
    '  Email:           ' . $email,
    '  Phone:           ' . ($phone !== '' ? $phone : '—'),
    '  Base city:       ' . $city,
    '  OTE expectation: ' . $ote,
    '  Travel:          ' . $travel,
    '  LinkedIn:        ' . ($linkedin !== '' ? $linkedin : '—'),
    '',
    'MESSAGE',
    '  ' . ($message !== '' ? str_replace("\n", "\n  ", $message) : '—'),
    '',
    '---',
    sprintf('Resume attached as %s (%s, %d KB)', $attachmentName, $detectedMime, (int) round($size / 1024)),
    'Submitted ' . gmdate('Y-m-d H:i:s') . ' UTC from ' . dr_client_ip(),
    'Consent to the Privacy Policy was given at submission.',
], static fn($line) => $line !== null);

$sent = dr_send(
    $subject,
    implode("\n", $lines),
    $name,
    $email,
    ['name' => $attachmentName, 'mime' => $detectedMime, 'data' => $fileContents]
);

if (!$sent) {
    error_log('apply.php: delivery failed for ' . dr_header_safe($email));
    dr_respond(false, 'We could not send that just now. Please email your resume to apply@diamond-recruiters.com.', 502);
}

dr_respond(true, '', 200);
