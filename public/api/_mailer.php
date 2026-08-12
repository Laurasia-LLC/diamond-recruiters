<?php
/**
 * Shared plumbing for the site's two form endpoints (apply.php, contact.php).
 *
 * Handles configuration loading, spam traps, rate limiting, MIME assembly and
 * delivery via either authenticated SMTP or PHP mail().
 */

declare(strict_types=1);

// Never let a PHP notice or warning print into the response. Any output before
// dr_respond() runs would both corrupt the JSON and lock in a 200 status,
// because PHP flushes headers on first output. Errors go to the log instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Guard against direct execution — this file only defines functions.
if (basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

const MIN_FILL_SECONDS  = 3;      // faster than this is a bot
const RATE_LIMIT_MAX    = 5;      // submissions ...
const RATE_LIMIT_WINDOW = 3600;   // ... per IP per hour

function dr_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = [
        'to'          => ['apply@diamond-recruiters.com'],
        'from_email'  => 'apply@diamond-recruiters.com',
        'from_name'   => 'Diamond Recruiters Website',
        'success_url' => '/thank-you',
        'smtp_host'   => '',
        'smtp_port'   => 587,
        'smtp_user'   => '',
        'smtp_pass'   => '',
    ];

    $file = __DIR__ . '/config.php';
    $config = is_readable($file) ? array_merge($defaults, (array) require $file) : $defaults;

    return $config;
}

function dr_wants_json(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $xhr    = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    return str_contains((string) $accept, 'application/json') || $xhr === 'XMLHttpRequest';
}

function dr_respond(bool $ok, string $message, int $status, ?string $redirect = null): never
{
    $redirect ??= dr_config()['success_url'];

    if (dr_wants_json()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $message]);
    } elseif ($ok) {
        http_response_code(303);
        header('Location: ' . $redirect);
    } else {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        echo '<!doctype html><meta charset=utf-8><title>Message not sent</title>'
           . '<body style="font-family:system-ui;max-width:34rem;margin:12vh auto;padding:0 1.5rem;line-height:1.6">'
           . '<h1 style="font-size:1.4rem">We could not send that</h1><p>' . $safe . '</p>'
           . '<p>Please email <a href="mailto:apply@diamond-recruiters.com">apply@diamond-recruiters.com</a>'
           . ' and we will pick it up from there.</p>'
           . '<p><a href="/">Back to the site</a></p></body>';
    }
    exit;
}

/** Strips CR/LF so user input can never inject extra mail headers. */
function dr_header_safe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0", '%0a', '%0d'], '', $value));
}

function dr_field(string $key, int $maxLength = 2000): string
{
    $raw = $_POST[$key] ?? '';
    if (!is_string($raw)) {
        return '';
    }
    return mb_substr(trim($raw), 0, $maxLength);
}

function dr_client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

/**
 * Per-IP throttle backed by a temp file. Shared hosting gives us no shared
 * cache, so this is the pragmatic option.
 */
function dr_rate_limited(): bool
{
    $path = sys_get_temp_dir() . '/dr_form_' . sha1(dr_client_ip()) . '.json';
    $now  = time();

    $hits = [];
    if (is_readable($path)) {
        $decoded = json_decode((string) file_get_contents($path), true);
        if (is_array($decoded)) {
            $hits = array_values(array_filter(
                $decoded,
                static fn($t) => is_int($t) && $t > $now - RATE_LIMIT_WINDOW
            ));
        }
    }

    if (count($hits) >= RATE_LIMIT_MAX) {
        return true;
    }

    $hits[] = $now;
    @file_put_contents($path, json_encode($hits), LOCK_EX);
    return false;
}

/**
 * Runs the shared preflight: method check, spam traps, rate limit.
 * Silently reports success to bots so they do not retry with a new shape.
 */
function dr_preflight(string $honeypotField): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        dr_respond(false, 'This endpoint only accepts form submissions.', 405);
    }

    if (dr_field($honeypotField) !== '') {
        dr_respond(true, '', 200);
    }

    // Time trap. The stamp comes from the visitor's clock, so a negative
    // elapsed time means their clock runs fast — not that they are a bot.
    // Only trap the genuinely-too-fast window, or real applications from
    // skewed machines would be silently swallowed.
    $renderedAt = (int) dr_field('rendered_at', 20);
    if ($renderedAt > 0) {
        $elapsed = time() - $renderedAt;
        if ($elapsed >= 0 && $elapsed < MIN_FILL_SECONDS) {
            dr_respond(true, '', 200);
        }
    }

    if (dr_rate_limited()) {
        dr_respond(false, 'Too many submissions from this connection. Please try again later, or email us directly.', 429);
    }
}

// -------------------------------------------------------------------------
// Minimal SMTP client — used only when smtp_host is configured
// -------------------------------------------------------------------------

function dr_smtp_send(array $config, array $recipients, string $headers, string $body, string $subject): bool
{
    $host    = (string) $config['smtp_host'];
    $port    = (int) $config['smtp_port'];
    $timeout = 20;
    $ehlo    = (string) ($_SERVER['SERVER_NAME'] ?? 'localhost');

    $transport = $port === 465 ? 'ssl://' : 'tcp://';
    $socket = @stream_socket_client($transport . $host . ':' . $port, $errno, $errstr, $timeout);
    if (!$socket) {
        error_log("SMTP connect failed: {$errno} {$errstr}");
        return false;
    }
    stream_set_timeout($socket, $timeout);

    $read = static function ($socket): string {
        $data = '';
        while (($line = fgets($socket, 515)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };

    $cmd = static function ($socket, string $command, string $expect) use ($read): bool {
        if ($command !== '') {
            fwrite($socket, $command . "\r\n");
        }
        $response = $read($socket);
        if (!str_starts_with($response, $expect)) {
            error_log('SMTP unexpected reply to "' . substr($command, 0, 16) . '": ' . trim($response));
            return false;
        }
        return true;
    };

    $ok = $cmd($socket, '', '220') && $cmd($socket, 'EHLO ' . $ehlo, '250');

    if ($ok && $port !== 465) {
        $ok = $cmd($socket, 'STARTTLS', '220')
            && stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)
            && $cmd($socket, 'EHLO ' . $ehlo, '250');
    }

    if ($ok && (string) $config['smtp_user'] !== '') {
        $ok = $cmd($socket, 'AUTH LOGIN', '334')
            && $cmd($socket, base64_encode((string) $config['smtp_user']), '334')
            && $cmd($socket, base64_encode((string) $config['smtp_pass']), '235');
    }

    if ($ok) {
        $ok = $cmd($socket, 'MAIL FROM:<' . $config['from_email'] . '>', '250');
    }

    foreach ($recipients as $recipient) {
        if (!$ok) {
            break;
        }
        $ok = $cmd($socket, 'RCPT TO:<' . $recipient . '>', '250');
    }

    if ($ok && $cmd($socket, 'DATA', '354')) {
        $message = 'Subject: ' . $subject . "\r\n"
                 . 'To: ' . implode(', ', $recipients) . "\r\n"
                 . $headers . "\r\n\r\n"
                 . preg_replace('/^\./m', '..', $body) . "\r\n.";
        $ok = $cmd($socket, $message, '250');
    } else {
        $ok = false;
    }

    fwrite($socket, "QUIT\r\n");
    fclose($socket);

    return $ok;
}

/**
 * Builds and delivers the message.
 *
 * @param array|null $attachment ['name' => string, 'mime' => string, 'data' => string]
 */
function dr_send(
    string $subject,
    string $textBody,
    string $replyToName,
    string $replyToEmail,
    ?array $attachment = null
): bool {
    $config = dr_config();

    $recipients = array_values(array_filter(
        (array) $config['to'],
        static fn($address) => filter_var($address, FILTER_VALIDATE_EMAIL) !== false
    ));

    if ($recipients === []) {
        error_log('dr_send: no valid recipient configured');
        return false;
    }

    $replyToName  = dr_header_safe($replyToName);
    $replyToEmail = dr_header_safe($replyToEmail);

    $headerLines = [
        'MIME-Version: 1.0',
        'From: ' . sprintf('%s <%s>', $config['from_name'], $config['from_email']),
        'X-Mailer: diamond-recruiters-site',
        'Auto-Submitted: auto-generated',
    ];

    if (filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
        $headerLines[] = 'Reply-To: ' . sprintf('%s <%s>', $replyToName, $replyToEmail);
    }

    if ($attachment === null) {
        $headerLines[] = 'Content-Type: text/plain; charset=UTF-8';
        $headerLines[] = 'Content-Transfer-Encoding: 8bit';
        $body = $textBody;
    } else {
        $boundary = 'dr_' . bin2hex(random_bytes(16));
        $headerLines[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

        $body = implode("\r\n", [
            '--' . $boundary,
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            $textBody,
            '',
            '--' . $boundary,
            'Content-Type: ' . $attachment['mime'] . '; name="' . $attachment['name'] . '"',
            'Content-Transfer-Encoding: base64',
            'Content-Disposition: attachment; filename="' . $attachment['name'] . '"',
            '',
            chunk_split(base64_encode($attachment['data']), 76, "\r\n"),
            '--' . $boundary . '--',
            '',
        ]);
    }

    $headers = implode("\r\n", $headerLines);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    if ((string) $config['smtp_host'] !== '') {
        return dr_smtp_send($config, $recipients, $headers, $body, $encodedSubject);
    }

    return @mail(
        implode(', ', $recipients),
        $encodedSubject,
        $body,
        $headers,
        '-f' . $config['from_email']
    );
}
